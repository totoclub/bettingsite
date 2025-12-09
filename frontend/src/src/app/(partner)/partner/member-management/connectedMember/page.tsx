"use client";
import React, { useEffect, useState } from "react";
import {
  Layout,
  Space,
  Card,
  Table,
  Button,
  Input,
  Select,
  Tag,
  Radio,
  message,
} from "antd";
import type { TableProps } from "antd";
import { Content } from "antd/es/layout/layout";
import { useFormatter, useTranslations } from "next-intl";
import dayjs from "dayjs";
import { formatNumber } from "@/lib";
import api from "@/api";
import { ReloadOutlined } from "@ant-design/icons";
import { usePageTitle } from "@/hooks/usePageTitle";

interface ConnectedMember {
  id: number;
  userid: string;
  nickname: string;
  depositor: string;
  amountHeld: number;
  point: number;
  rollingGold: number;
  deposit: number;
  withdrawal: number;
  entryAndExit: number;
  bet: number;
  winner: number;
  beDang: number;
  connectionGame: string;
  accessDomain: string;
  connectionIP: string;
  accessDate: string;
  dateOfRegistration: string;
  onlineStatus: boolean;
}

export default function ConnectedMemberPage() {
  usePageTitle("Partner - Connected Members");
  const t = useTranslations();
  const f = useFormatter();
  const [loading, setLoading] = useState<boolean>(false);
  const [members, setMembers] = useState<ConnectedMember[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [onlineStatusFilter, setOnlineStatusFilter] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<string>("");

  // Update current time
  useEffect(() => {
    const updateTime = () => {
      const now = dayjs().format("YYYY-MM-DD HH:mm:ss");
      setCurrentTime(now);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch connected members
  const fetchMembers = async (page?: number, perPage?: number, search?: string, onlineStatus?: string) => {
    setLoading(true);
    try {
      const params: any = {
        page: page ?? currentPage,
        perPage: perPage ?? pageSize,
      };

      const searchValue = search ?? searchQuery;
      if (searchValue) {
        params.search = searchValue;
      }

      const onlineStatusValue = onlineStatus ?? onlineStatusFilter;
      if (onlineStatusValue) {
        params.onlineStatus = onlineStatusValue;
      }

      const response = await api("partner/member-management/connected-members", {
        method: "GET",
        params,
      });

      if (response.success) {
        setMembers(response.data || []);
        setTotal(response.pagination?.total || 0);
      } else {
        message.error("Failed to fetch connected members");
      }
    } catch (error: any) {
      console.error("Error fetching connected members:", error);
      message.error(error?.response?.data?.message || "Failed to fetch connected members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [currentPage, pageSize, onlineStatusFilter]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMembers();
    }, 10000);

    return () => clearInterval(interval);
  }, [currentPage, pageSize, searchQuery, onlineStatusFilter]);

  const onSearch = () => {
    setCurrentPage(1);
    fetchMembers(1, pageSize, searchQuery, onlineStatusFilter);
  };

  const onOnlineStatusChange = (value: string) => {
    setOnlineStatusFilter(value);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    fetchMembers();
  };

  const popupWindow = (id: number) => {
    window.open(`/partner/popup/user?id=${id}`, '_blank', 'width=screen.width,height=screen.height,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no');
  }

  const columns: TableProps<ConnectedMember>["columns"] = [
    {
      title: t("number"),
      dataIndex: "number",
      key: "number",
      width: 80,
      render: (_, record, index) => {
        return (currentPage - 1) * pageSize + index + 1;
      },
    },
    {
      title: t("userid"),
      dataIndex: "userid",
      key: "userid",
      width: 150,
      render: (text, record) => {
        return (
          <div className="flex items-center gap-1 cursor-pointer" onClick={() => popupWindow(record.id || 0)}>
            <div className="w-4 h-4 flex items-center justify-center rounded-full bg-[#1677ff] text-white text-xs">
              1
            </div>
            <span className="text-xs text-[white] bg-[#000] px-1 py-0.5 rounded">
              {text}
            </span>
          </div>
        );
      },
    },
    {
      title: t("nickname"),
      dataIndex: "nickname",
      key: "nickname",
      width: 120,
    },
    {
      title: t("depositor"),
      dataIndex: "depositor",
      key: "depositor",
      width: 120,
      render: (text) => (
        <span className="bg-red-100 dark:bg-red-900 px-2 py-1 rounded">
          {text}
        </span>
      ),
    },
    {
      title: t("amountHold"),
      dataIndex: "amountHeld",
      key: "amountHeld",
      width: 120,
      render: (text) => formatNumber(text || 0),
    },
    {
      title: t("point"),
      dataIndex: "point",
      key: "point",
      width: 100,
      render: (text) => formatNumber(text || 0),
    },
    {
      title: t("rollingGold"),
      dataIndex: "rollingGold",
      key: "rollingGold",
      width: 120,
      render: (text) => formatNumber(text || 0),
    },
    {
      title: t("deposit"),
      dataIndex: "deposit",
      key: "deposit",
      width: 120,
      render: (text) => formatNumber(text || 0),
    },
    {
      title: t("withdrawal"),
      dataIndex: "withdrawal",
      key: "withdrawal",
      width: 120,
      render: (text) => formatNumber(text || 0),
    },
    {
      title: t("entryAndExit") || "Entry and Exit",
      dataIndex: "entryAndExit",
      key: "entryAndExit",
      width: 120,
      render: (text) => formatNumber(text || 0),
    },
    {
      title: t("bet"),
      dataIndex: "bet",
      key: "bet",
      width: 120,
      render: (text) => formatNumber(text || 0),
    },
    {
      title: t("winner"),
      dataIndex: "winner",
      key: "winner",
      width: 120,
      render: (text) => formatNumber(text || 0),
    },
    {
      title: t("connectionGame") || "Connection game",
      dataIndex: "connectionGame",
      key: "connectionGame",
      width: 150,
      render: (text) => text || "-",
    },
    {
      title: t("accessDomain") || "Access domain",
      dataIndex: "accessDomain",
      key: "accessDomain",
      width: 150,
      render: (text) => text || "-",
    },
    {
      title: t("connectionIP") || "Connection IP",
      dataIndex: "connectionIP",
      key: "connectionIP",
      width: 150,
      render: (text) => text || "-",
    },
    {
      title: t("accessDate") || "Access date",
      dataIndex: "accessDate",
      key: "accessDate",
      width: 180,
      render: (text) => (text ? f.dateTime(new Date(text)) : "-"),
    },
    {
      title: t("dateOfRegistration"),
      dataIndex: "dateOfRegistration",
      key: "dateOfRegistration",
      width: 180,
      render: (text) => (text ? f.dateTime(new Date(text)) : "-"),
    },
    {
      title: t("onlineStatus") || "Online Status",
      dataIndex: "onlineStatus",
      key: "onlineStatus",
      width: 120,
      render: (text, record) => {
        const onlineStatus = record.onlineStatus;
        return (
          <Tag color={onlineStatus ? "green" : "default"}>
            {onlineStatus ? "Online" : "Offline"}
          </Tag>
        );
      },
    },
  ];

  const onChange: TableProps<ConnectedMember>["onChange"] = (
    pagination,
    filters,
    sorter
  ) => {
    if (pagination.current) {
      setCurrentPage(pagination.current);
    }
    if (pagination.pageSize) {
      setPageSize(pagination.pageSize);
      setCurrentPage(1);
    }
  };

  return (
    <Layout>
      <Content className="overflow-auto h-[calc(100vh-100px)] dark:bg-black">
        <Card
          title={
            <div className="flex justify-between items-center w-full">
              <span>{t("connectedMembers") || "Connected members"}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm">{currentTime}</span>
                <Button
                  type="text"
                  icon={<ReloadOutlined />}
                  onClick={handleRefresh}
                  size="small"
                />
              </div>
            </div>
          }
          classNames={{
            body: "!p-0",
          }}
        >
          <Space className="p-2 !w-full" direction="vertical">
            {/* Online Status Filter */}
            <Space wrap>
              <Radio.Group
                size="small"
                optionType="button"
                buttonStyle="solid"
                value={onlineStatusFilter}
                onChange={(e) => onOnlineStatusChange(e.target.value)}
                options={[
                  { label: t("all") || "All", value: "" },
                  { label: t("online") || "Online", value: "true" },
                  { label: t("offline") || "Offline", value: "false" },
                ]}
              />
            </Space>
            {/* Search and Filter Section */}
            <Space className="!w-full justify-between" wrap>
              <Space wrap>
                <Space.Compact size="small">
                  <Input
                    size="small"
                    placeholder={t("idNicknameAccount") || "ID/Nickname/Account"}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onPressEnter={onSearch}
                    style={{ width: 250 }}
                  />
                  <Button
                    size="small"
                    type="primary"
                    onClick={onSearch}
                  >
                    {t("search")}
                  </Button>
                </Space.Compact>
              </Space>
              <Select
                size="small"
                value={pageSize}
                onChange={(value) => {
                  setPageSize(value);
                  setCurrentPage(1);
                }}
                style={{ width: 120 }}
                options={[
                  { label: "25 outputs", value: 25 },
                  { label: "50 outputs", value: 50 },
                  { label: "100 outputs", value: 100 },
                  { label: "250 outputs", value: 250 },
                  { label: "500 outputs", value: 500 },
                ]}
              />
            </Space>
          </Space>
          <Table<ConnectedMember>
            columns={columns}
            loading={loading}
            dataSource={members.map((m) => ({ ...m, key: m.id }))}
            className="w-full"
            size="small"
            scroll={{ x: "max-content" }}
            onChange={onChange}
            pagination={{
              showTotal: (total, range) => {
                return t("paginationLabel", {
                  from: range[0],
                  to: range[1],
                  total,
                });
              },
              total: total,
              current: currentPage,
              pageSize: pageSize,
              showSizeChanger: true,
              pageSizeOptions: ["25", "50", "100", "250", "500"],
            }}
            locale={{
              emptyText: t("noData") || "There is no data.",
            }}
          />
        </Card>
      </Content>
    </Layout>
  );
}