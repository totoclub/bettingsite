"use client";

import React, { useEffect, useState, useRef } from "react";
import { Badge, Button, Dropdown, Space, Tag, Typography, notification, Spin, Empty } from "antd";
import { BellOutlined, CheckCircleOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import apiCall, { wsURL } from "@/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Text } = Typography;

interface Alert {
  id: number;
  type: string;
  title: string;
  message: string;
  entityId: number;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  redirectUrl?: string;
}

const NotificationButton: React.FC = () => {
  const t = useTranslations();
  const router = useRouter();
  const [api, contextHolder] = notification.useNotification();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const ws = useRef<WebSocket | null>(null);
  const retryTimeout = useRef<NodeJS.Timeout | null>(null);
  const previousUnreadCount = useRef<number>(0);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const params: any = { limit: "10", pageSize: "10", page: "1", isRead: "false" };
      console.log("Fetching alerts from: admin/alerts with params:", params);
      const response = await apiCall("admin/alerts", {
        method: "GET",
        params,
      });
      console.log("Alerts response:", response);
      
      // Handle different response structures
      let alertsData: Alert[] = [];
      if (Array.isArray(response)) {
        alertsData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        alertsData = response.data;
      } else if (response?.status && response?.data && Array.isArray(response.data)) {
        alertsData = response.data;
      }
      
      console.log("Parsed alerts data:", alertsData, "Length:", alertsData.length);
      setAlerts(alertsData);
    } catch (error: any) {
      console.error("Error fetching alerts - full error:", error);
      // Don't throw - just log and continue with empty array
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await apiCall("admin/alerts/unread-count", {
        method: "GET",
      });
      console.log("Unread count response:", response);
      if (response && response.status && response.count !== undefined) {
        setUnreadCount(response.count);
      } else if (response && typeof response.count === "number") {
        setUnreadCount(response.count);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const markAsRead = async (alertId: number) => {
    try {
      await apiCall("admin/alerts/mark-read", {
        method: "POST",
        data: { id: alertId },
      });
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId ? { ...alert, isRead: true } : alert
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking alert as read:", error);
    }
  };

  const handleAlertClick = async (alert: Alert) => {
    // Close dropdown first
    setDropdownOpen(false);
    // Mark as read first if unread
    if (!alert.isRead) {
      await markAsRead(alert.id);
    }
    // Navigate to redirect URL if available
    if (alert.redirectUrl) {
      router.push(alert.redirectUrl);
    }
  };

  const connectWebSocket = () => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    try {
      // Connect to admin alerts channel via WebSocket
      // wsURL format: ws://host:port/api/v1/ws
      // We need: ws://host:port/api/v1/ws/info?userId=admin
      const wsUrl = wsURL.endsWith('/ws') 
        ? `${wsURL}/info?userId=admin` 
        : wsURL.includes('/ws/info') 
        ? `${wsURL}?userId=admin`
        : `${wsURL}/info?userId=admin`;
      console.log("Connecting to WebSocket:", wsUrl);
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log("WebSocket connected for alerts");
      };

      ws.current.onmessage = (event) => {
        try {
          let data: any;
          try {
            data = JSON.parse(event.data);
          } catch {
            // If event.data is already an object
            data = event.data;
          }
          
          // Check if it's an alert notification from Redis
          if (data && data.type && data.id && (data.type === "deposit" || data.type === "withdrawal" || data.type === "qna" || data.type === "point" || data.type === "rollingExchange" || data.type === "signup")) {
            const newAlert: Alert = {
              id: data.id,
              type: data.type,
              title: data.title || "New Alert",
              message: data.message || "",
              entityId: data.entityId || 0,
              isRead: false,
              readAt: null,
              createdAt: data.createdAt || new Date().toISOString(),
              redirectUrl: data.redirectUrl || data.redirect_url,
            };
            
            setAlerts((prev) => [newAlert, ...prev]);
            setUnreadCount((prev) => prev + 1);
            
            // Show notification popup
            api.info({
              message: newAlert.title,
              description: newAlert.message,
              placement: "topRight",
              duration: 5,
            });
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.current.onclose = () => {
        console.log("WebSocket closed, reconnecting...");
        retryTimeout.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    } catch (error) {
      console.error("Error connecting WebSocket:", error);
    }
  };

  useEffect(() => {
    fetchAlerts();
    fetchUnreadCount().then(() => {
      previousUnreadCount.current = unreadCount;
    });
    connectWebSocket();

    // Poll for updates every 5 seconds as fallback
    const interval = setInterval(async () => {
      const oldCount = unreadCount;
      await fetchUnreadCount();
      await fetchAlerts();
      
      // Check if unread count increased (new alerts arrived)
      if (oldCount > 0 && unreadCount > oldCount) {
        // Fetch latest alerts to show notification
        const latestAlerts = alerts.filter(a => !a.isRead);
        if (latestAlerts.length > 0) {
          const latestAlert = latestAlerts[0];
          api.info({
            message: latestAlert.title,
            description: latestAlert.message,
            placement: "topRight",
            duration: 5,
          });
        }
      }
      previousUnreadCount.current = unreadCount;
    }, 5000);

    return () => {
      if (ws.current) {
        ws.current.close();
      }
      if (retryTimeout.current) {
        clearTimeout(retryTimeout.current);
      }
      clearInterval(interval);
    };
  }, []);

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case "deposit":
        return "#52c41a";
      case "withdrawal":
        return "#fa8c16";
      case "qna":
        return "#1890ff";
      case "point":
        return "#722ed1";
      case "rollingExchange":
        return "#13c2c2";
      case "signup":
        return "#faad14";
      default:
        return "#8c8c8c";
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case "deposit":
        return "Deposit";
      case "withdrawal":
        return "Withdrawal";
      case "qna":
        return "QNA";
      case "point":
        return "Point";
      case "rollingExchange":
        return "Rolling";
      case "signup":
        return "Signup";
      default:
        return type;
    }
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return "💰";
      case "withdrawal":
        return "💸";
      case "qna":
        return "❓";
      case "point":
        return "⭐";
      case "rollingExchange":
        return "🔄";
      case "signup":
        return "👤";
      default:
        return "🔔";
    }
  };

  console.log("Current alerts state:", alerts.length, "unread count:", unreadCount, "alerts:", alerts);
  
  // Use alerts if available, otherwise show message
  const dropdownItems = alerts.length > 0
    ? [
        {
          key: "header",
          label: (
            <div style={{ 
              // padding: "12px 16px", 
              borderBottom: "2px solid #f0f0f0",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              // margin: "-8px -8px 8px -8px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text strong style={{ color: "#fff", fontSize: "14px" }}>
                  {t("notifications") || "Notifications"}
                </Text>
                {unreadCount > 0 && (
                  <Badge 
                    count={unreadCount} 
                    style={{ 
                      backgroundColor: "#ff4d4f",
                      boxShadow: "0 0 0 2px #fff"
                    }}
                  />
                )}
              </div>
            </div>
          ),
        },
        ...alerts.slice(0, 10).map((alert) => ({
          key: alert.id.toString(),
          label: (
            <div
              onClick={async (e) => {
                e.stopPropagation();
                await handleAlertClick(alert);
              }}
              style={{
                padding: "12px 16px",
                cursor: "pointer",
                backgroundColor: alert.isRead ? "#ffffff" : "#f6f8ff",
                borderLeft: alert.isRead ? "3px solid transparent" : `3px solid ${getAlertTypeColor(alert.type)}`,
                transition: "all 0.2s ease",
                position: "relative",
                marginBottom: "4px",
                borderRadius: "6px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = alert.isRead ? "#f5f5f5" : "#e6f0ff";
                e.currentTarget.style.transform = "translateX(2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = alert.isRead ? "#ffffff" : "#f6f8ff";
                e.currentTarget.style.transform = "translateX(0)";
              }}
            >
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: `linear-gradient(135deg, ${getAlertTypeColor(alert.type)}15, ${getAlertTypeColor(alert.type)}25)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  flexShrink: 0,
                }}>
                  {getAlertTypeIcon(alert.type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                      <Tag 
                        color={getAlertTypeColor(alert.type)}
                        style={{ 
                          margin: 0,
                          borderRadius: "4px",
                          border: "none",
                          fontWeight: 500,
                          fontSize: "11px",
                        }}
                      >
                        {getAlertTypeLabel(alert.type)}
                      </Tag>
                      {!alert.isRead && (
                        <div style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: getAlertTypeColor(alert.type),
                          boxShadow: `0 0 6px ${getAlertTypeColor(alert.type)}80`,
                          animation: "pulse 2s infinite",
                        }} />
                      )}
                    </div>
                    {alert.isRead ? (
                      <CheckCircleOutlined style={{ color: "#52c41a", fontSize: "14px" }} />
                    ) : (
                      <ClockCircleOutlined style={{ color: getAlertTypeColor(alert.type), fontSize: "14px" }} />
                    )}
                  </div>
                  <Text 
                    strong 
                    style={{ 
                      fontSize: "13px",
                      color: alert.isRead ? "#595959" : "#262626",
                      display: "block",
                      marginBottom: "4px",
                      lineHeight: "1.4",
                    }}
                  >
                    {alert.title}
                  </Text>
                  <Text 
                    type="secondary" 
                    style={{ 
                      fontSize: "12px",
                      display: "block",
                      marginBottom: "6px",
                      lineHeight: "1.4",
                      color: "#8c8c8c",
                    }}
                  >
                    {alert.message.length > 60
                      ? `${alert.message.substring(0, 60)}...`
                      : alert.message}
                  </Text>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Text 
                      type="secondary" 
                      style={{ 
                        fontSize: "11px",
                        color: "#bfbfbf",
                      }}
                    >
                      {dayjs(alert.createdAt).fromNow()}
                    </Text>
                    <span style={{ color: "#d9d9d9", margin: "0 4px" }}>•</span>
                    <Text 
                      type="secondary" 
                      style={{ 
                        fontSize: "11px",
                        color: "#bfbfbf",
                      }}
                    >
                      {dayjs(alert.createdAt).format("MMM DD, HH:mm")}
                    </Text>
                  </div>
                </div>
              </div>
            </div>
          ),
        })),
        {
          key: "view-all",
          label: (
            <div style={{ 
              padding: "12px 16px", 
              borderTop: "1px solid #f0f0f0", 
              textAlign: "center",
              background: "#fafafa",
              marginTop: "8px",
            }}>
              <Button
                type="primary"
                onClick={() => {
                  setDropdownOpen(false);
                  router.push("/admin/alert");
                }}
                style={{ 
                  width: "100%",
                  borderRadius: "6px",
                  height: "36px",
                  fontWeight: 500,
                }}
              >
                {t("viewAll") || "View All Notifications"}
              </Button>
            </div>
          ),
        },
      ]
    : loading
    ? [
        {
          key: "loading",
          label: (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <Spin size="large" />
              <div style={{ marginTop: "16px" }}>
                <Text type="secondary">{t("loadingNotifications") || "Loading notifications..."}</Text>
              </div>
            </div>
          ),
        },
      ]
    : [
        {
          key: "no-alerts",
          label: (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Text type="secondary" style={{ fontSize: "13px" }}>
                    {t("noNewNotifications") || "No new notifications"}
                  </Text>
                }
              />
            </div>
          ),
        },
        {
          key: "view-all",
          label: (
            <div style={{ 
              padding: "12px 16px", 
              borderTop: "1px solid #f0f0f0", 
              textAlign: "center",
              background: "#fafafa",
            }}>
              <Button
                type="default"
                onClick={() => {
                  setDropdownOpen(false);
                  router.push("/admin/alert");
                }}
                style={{ 
                  width: "100%",
                  borderRadius: "6px",
                  height: "36px",
                }}
              >
                {t("viewAll") || "View All Notifications"}
              </Button>
            </div>
          ),
        },
      ];

  return (
    <>
      {contextHolder}
      <Dropdown
        menu={{
          items: dropdownItems,
        }}
        open={dropdownOpen}
        onOpenChange={setDropdownOpen}
        className="!mb-[8px]"
        trigger={["click"]}
        placement="bottomRight"
        popupRender={(menu) => (
          <div style={{ 
            minWidth: 380, 
            maxWidth: 420,
            maxHeight: "70vh",
            overflowY: "auto",
            borderRadius: "12px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
            background: "#fff",
          }}>
            {menu}
          </div>
        )}
      >
        <Badge 
          count={unreadCount} 
          size="small"
          offset={[-4, 4]}
          style={{
            boxShadow: unreadCount > 0 ? "0 0 0 2px #fff" : "none",
          }}
        >
          <Button
            type="text"
            icon={<BellOutlined />}
            className={`notification-bell-button ${unreadCount > 0 ? 'has-unread' : ''}`}
            style={{ 
              fontSize: "20px",
              width: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "8px",
              color: unreadCount > 0 ? "#1890ff" : "inherit",
            }}
          />
        </Badge>
      </Dropdown>
    </>
  );
};

export default NotificationButton;

