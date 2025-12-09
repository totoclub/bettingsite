"use client";
import React, { useEffect, useState } from "react";
import {
  Layout,
  Space,
  Card,
  Table,
  Button,
  Input,
  DatePicker,
  Radio,
  Select,
  message,
} from "antd";
import type { TableProps } from "antd";
import { Content } from "antd/es/layout/layout";
import { useFormatter, useTranslations } from "next-intl";
import dayjs, { Dayjs } from "dayjs";
import api from "@/api";
import { ReloadOutlined } from "@ant-design/icons";
import { usePageTitle } from "@/hooks/usePageTitle";

const { RangePicker } = DatePicker;

interface WaitingForMemberApproval {
  id: number;
  userid: string;
  nickname: string;
  signUpPath: string;
  subscriptionIP: string;
  registrationDomain: string;
  dateOfRegistration: string;
}

export default function WaitingForMemberApprovalPage() {
  usePageTitle("Partner - Waiting For Member Approval Page");
  const t = useTranslations();
  const f = useFormatter();
  const [loading, setLoading] = useState<boolean>(false);
  const [members, setMembers] = useState<WaitingForMemberApproval[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [memberStatusFilter, setMemberStatusFilter] = useState<string>("pending");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
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

  // Fetch members
  const fetchMembers = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        perPage: pageSize,
      };

      if (memberStatusFilter) {
        params.memberStatus = memberStatusFilter;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.dateFrom = dateRange[0].format("YYYY-MM-DD");
        params.dateTo = dateRange[1].format("YYYY-MM-DD");
      }

      const response = await api("partner/member-management/waiting-for-member-approval", {
        method: "GET",
        params,
      });

      if (response.success) {
        setMembers(response.data || []);
        setTotal(response.pagination?.total || 0);
      } else {
        message.error("Failed to fetch members");
      }
    } catch (error: any) {
      console.error("Error fetching members:", error);
      message.error(error?.response?.data?.message || "Failed to fetch members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, memberStatusFilter, dateRange]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMembers();
    }, 60000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, memberStatusFilter, dateRange, searchQuery]);

  const onSearch = () => {
    setCurrentPage(1);
    fetchMembers();
  };

  const onDateRangeChange = (dates: (Dayjs | null)[] | null) => {
    if (dates) {
      setDateRange([dates[0], dates[1]]);
    } else {
      setDateRange(null);
    }
    setCurrentPage(1);
  };

  const onMemberStatusChange = (value: string) => {
    setMemberStatusFilter(value);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    fetchMembers();
  };

  const popupWindow = (id: number) => {
    window.open(`/partner/popup/user?id=${id}`, '_blank', 'width=screen.width,height=screen.height,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no');
  }

  const columns: TableProps<WaitingForMemberApproval>["columns"] = [
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
      title: t("id"),
      dataIndex: "userid",
      key: "userid",
      width: 150,
      render: (text, record) => {
        return (
          <div className="flex items-center gap-1 cursor-pointer" onClick={() => popupWindow(record.id || 0)}>
            <div className="w-4 h-4 flex items-center justify-center rounded-full bg-[#1677ff] text-white text-xs">
              0
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
      title: t("signUpPath"),
      dataIndex: "signUpPath",
      key: "signUpPath",
      width: 150,
      render: (text) => text || "-",
    },
    {
      title: t("subscriptionIP"),
      dataIndex: "subscriptionIP",
      key: "subscriptionIP",
      width: 150,
      render: (text) => text || "-",
    },
    {
      title: t("registrationDomain"),
      dataIndex: "registrationDomain",
      key: "registrationDomain",
      width: 180,
      render: (text) => text || "-",
    },
    {
      title: t("dateOfRegistration"),
      dataIndex: "dateOfRegistration",
      key: "dateOfRegistration",
      width: 180,
      render: (text) => {
        return text ? f.dateTime(new Date(text)) : "-";
      },
    },
  ];

  const onChange: TableProps<WaitingForMemberApproval>["onChange"] = (
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
              <span>{t("waitingForMemberApproval")}</span>
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
            {/* Search and Filter Section */}
            <Space className="!w-full justify-between" wrap>
              <Space wrap>
                <RangePicker
                  size="small"
                  value={dateRange}
                  onChange={onDateRangeChange}
                  showTime={{
                    format: "HH:mm",
                  }}
                  format="YYYY-MM-DD HH:mm"
                />
                <Input.Search
                  size="small"
                  placeholder={t("idNicknameAccount")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onSearch={onSearch}
                  enterButton={t("search")}
                  style={{ width: 300 }}
                />
              </Space>
              <Space.Compact className="gap-1">
                <Radio.Group
                  size="small"
                  optionType="button"
                  buttonStyle="solid"
                  value={memberStatusFilter}
                  onChange={(e) => onMemberStatusChange(e.target.value)}
                  options={[
                    {
                      label: t("waiting_approval"),
                      value: "pending",
                    },
                    {
                      label: t("joined_today"),
                      value: "today",
                    },
                  ]}
                />
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
              </Space.Compact>
            </Space>
          </Space>
          <Table<WaitingForMemberApproval>
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
          />
        </Card>
      </Content>
    </Layout>
  );
}
