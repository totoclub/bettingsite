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
  Tag,
  message,
} from "antd";
import type { TableProps } from "antd";
import { Content } from "antd/es/layout/layout";
import { useFormatter, useTranslations } from "next-intl";
import dayjs, { Dayjs } from "dayjs";
import api from "@/api";
import { ReloadOutlined } from "@ant-design/icons";
import { formatNumber } from "@/lib";
import { usePageTitle } from "@/hooks/usePageTitle";

const { RangePicker } = DatePicker;

interface DirectMemberDepositWithdrawal {
  id: number;
  userId: number;
  userid: string;
  nickname: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  status: string;
  transactionAt: string;
  approvedAt?: string;
  createdAt: string;
}

export default function DirectMemberDepositWithdrawalPage() {
  usePageTitle("Partner - Direct Member Deposit Withdrawal Page");
  const t = useTranslations();
  const f = useFormatter();
  const [loading, setLoading] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<DirectMemberDepositWithdrawal[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [typeFilter, setTypeFilter] = useState<string>("entire");
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

  // Fetch transactions
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        perPage: pageSize,
      };

      if (typeFilter && typeFilter !== "entire") {
        params.type = typeFilter;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.dateFrom = dateRange[0].format("YYYY-MM-DD HH:mm");
        params.dateTo = dateRange[1].format("YYYY-MM-DD HH:mm");
      }

      const response = await api("partner/member-management/direct-member-deposit-withdrawal", {
        method: "GET",
        params,
      });

      if (response.success) {
        setTransactions(response.data || []);
        setTotal(response.pagination?.total || 0);
      } else {
        message.error("Failed to fetch transactions");
      }
    } catch (error: any) {
      console.error("Error fetching transactions:", error);
      message.error(error?.response?.data?.message || "Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, typeFilter, dateRange]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTransactions();
    }, 60000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, typeFilter, dateRange, searchQuery]);

  const onSearch = () => {
    setCurrentPage(1);
    fetchTransactions();
  };

  const onDateRangeChange = (dates: (Dayjs | null)[] | null) => {
    if (dates) {
      setDateRange([dates[0], dates[1]]);
    } else {
      setDateRange(null);
    }
    setCurrentPage(1);
  };

  const onTypeChange = (value: string) => {
    setTypeFilter(value);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    fetchTransactions();
  };

  const popupWindow = (id: number) => {
    window.open(`/partner/popup/user?id=${id}`, '_blank', 'width=screen.width,height=screen.height,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no');
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "settled":
      case "S":
        return "green";
      case "pending":
      case "P":
        return "orange";
      case "cancelled":
      case "C":
        return "red";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "settled":
      case "S":
        return t("settled") || "Settled";
      case "pending":
      case "P":
        return t("pending") || "Pending";
      case "cancelled":
      case "C":
        return t("cancelled") || "Cancelled";
      default:
        return status;
    }
  };

  const columns: TableProps<DirectMemberDepositWithdrawal>["columns"] = [
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
          <div className="flex items-center gap-1 cursor-pointer" onClick={() => popupWindow(record.userId || 0)}>
            <div className="w-4 h-4 flex items-center justify-center rounded-full bg-[#1677ff] text-white text-xs">
              0
            </div>
            <span className="text-xs text-[white] bg-[#000] px-1 py-0.5 rounded">
              {text || "-"}
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
      render: (text) => text || "-",
    },
    {
      title: t("type"),
      dataIndex: "type",
      key: "type",
      width: 120,
      render: (text) => {
        const isDeposit = text === "deposit";
        return (
          <Tag color={isDeposit ? "blue" : "red"}>
            {isDeposit ? (t("deposit") || "Deposit") : (t("withdrawal") || "Withdrawal")}
          </Tag>
        );
      },
    },
    {
      title: t("amount"),
      dataIndex: "amount",
      key: "amount",
      width: 120,
      render: (text, record) => {
        const isDeposit = record.type === "deposit";
        return (
          <span className={isDeposit ? "text-green-600" : "text-red-600"}>
            {isDeposit ? "+" : "-"}
            {formatNumber(text || 0)}
          </span>
        );
      },
    },
    {
      title: t("balanceBefore"),
      dataIndex: "balanceBefore",
      key: "balanceBefore",
      width: 120,
      render: (text) => formatNumber(text || 0),
    },
    {
      title: t("balanceAfter"),
      dataIndex: "balanceAfter",
      key: "balanceAfter",
      width: 120,
      render: (text) => formatNumber(text || 0),
    },
    {
      title: t("status"),
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (text) => (
        <Tag color={getStatusColor(text)}>{getStatusText(text)}</Tag>
      ),
    },
    {
      title: t("transactionAt"),
      dataIndex: "transactionAt",
      key: "transactionAt",
      width: 180,
      render: (text) => {
        return text ? f.dateTime(new Date(text)) : "-";
      },
    },
  ];

  const onChange: TableProps<DirectMemberDepositWithdrawal>["onChange"] = (
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
              <span>{t("directMemberDepositWithdrawal") || "Direct Member Deposit Withdrawal"}</span>
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
                  placeholder={t("idNicknameAccount") || "ID/Nickname/Account"}
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
                  value={typeFilter}
                  onChange={(e) => onTypeChange(e.target.value)}
                  options={[
                    {
                      label: t("entire") || "Entire",
                      value: "entire",
                    },
                    {
                      label: t("deposit") || "Deposit",
                      value: "deposit",
                    },
                    {
                      label: t("withdrawal") || "Withdrawal",
                      value: "withdrawal",
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
          <Table<DirectMemberDepositWithdrawal>
            columns={columns}
            loading={loading}
            dataSource={transactions.map((t) => ({ ...t, key: t.id }))}
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
