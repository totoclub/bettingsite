"use client";
import React, { useEffect, useState } from "react";
import {
  Layout,
  Space,
  Card,
  Table,
  Tag,
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
import { formatNumber } from "@/lib";
import { USER_STATUS, USER_TYPE } from "@/constants";
import api from "@/api";
import { ReloadOutlined, UserAddOutlined } from "@ant-design/icons";
import DirectMemberRegistrationModal from "@/components/Partner/DirectMemberRegistrationModal";
import { usePageTitle } from "@/hooks/usePageTitle";

const { RangePicker } = DatePicker;

interface DirectMember {
  id: number;
  userid: string;
  nickname: string;
  depositor: string;
  amountHeld: number;
  point: number;
  rollingGold: number;
  deposit: number;
  withdrawal: number;
  bet: number;
  winner: number;
  accessDate: string;
  dateOfRegistration: string;
  status: string;
  type: string;
}

interface TotalRow {
  userid: string;
  nickname: string;
  depositor: string;
  amountHeld: number;
  point: number;
  rollingGold: number;
  deposit: number;
  withdrawal: number;
  bet: number;
  winner: number;
}

export default function DirectMemberListPage() {
  usePageTitle("Partner - User Management Page");
  const t = useTranslations();
  const f = useFormatter();
  const [loading, setLoading] = useState<boolean>(false);
  const [members, setMembers] = useState<DirectMember[]>([]);
  const [totalRow, setTotalRow] = useState<TotalRow | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState<boolean>(false);

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

      if (statusFilter) {
        params.status = statusFilter;
      }
      if (typeFilter) {
        params.type = typeFilter;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.dateFrom = dateRange[0].format("YYYY-MM-DD");
        params.dateTo = dateRange[1].format("YYYY-MM-DD");
      }

      const response = await api("partner/member-management/direct-members", {
        method: "GET",
        params,
      });

      if (response.success) {
        setMembers(response.data || []);
        setTotalRow(response.total || null);
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
  }, [currentPage, pageSize, statusFilter, typeFilter, dateRange]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMembers();
    }, 60000);

    return () => clearInterval(interval);
  }, [currentPage, pageSize, statusFilter, typeFilter, dateRange, searchQuery]);

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

  const onStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const onTypeChange = (value: string) => {
    setTypeFilter(value);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    fetchMembers();
  };

  const handleDirectMemberRegistration = () => {
    setIsRegistrationModalOpen(true);
  };

  const handleRegistrationSuccess = () => {
    // Refresh the member list after successful registration
    fetchMembers();
  };

  const popupWindow = (id: number) => {
    window.open(`/partner/popup/user?id=${id}`, '_blank', 'width=screen.width,height=screen.height,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no');
  }

  // Prepare table data with total row
  const tableData: (DirectMember & { isTotal?: boolean; key: string | number })[] = totalRow
    ? [
        {
          key: t("total"),
          id: 0,
          userid: totalRow.userid,
          nickname: totalRow.nickname,
          depositor: totalRow.depositor,
          amountHeld: totalRow.amountHeld,
          point: totalRow.point,
          rollingGold: totalRow.rollingGold,
          deposit: totalRow.deposit,
          withdrawal: totalRow.withdrawal,
          bet: totalRow.bet,
          winner: totalRow.winner,
          accessDate: "",
          dateOfRegistration: "",
          status: "",
          type: "",
          isTotal: true,
        },
        ...members.map((m) => ({ ...m, key: m.id, isTotal: false })),
      ]
    : members.map((m) => ({ ...m, key: m.id, isTotal: false }));

  const columns: TableProps<DirectMember & { isTotal?: boolean; key: string | number }>["columns"] = [
    {
      title: t("number"),
      dataIndex: "number",
      key: "number",
      width: 80,
      render: (_, record, index) => {
        if (record.isTotal) return "total";
        return index;
      },
    },
    {
      title: t("id"),
      dataIndex: "userid",
      key: "userid",
      width: 150,
      render: (text, record) => {
        if (record.isTotal) return "-";
        return (
          <div className="flex items-center gap-1 cursor-pointer" onClick={() => popupWindow(record.id || 0)}>
            <div className="w-4 h-4 flex items-center justify-center rounded-full bg-[#1677ff] text-white text-xs">
              {record.point > 0 ? 1 : 0}
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
      render: (text, record) => (record.isTotal ? "-" : text),
    },
    {
      title: t("depositor"),
      dataIndex: "depositor",
      key: "depositor",
      width: 120,
      render: (text, record) => (record.isTotal ? "-" : text),
    },
    {
      title: t("amountHeld"),
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
      title: t("accessDate"),
      dataIndex: "accessDate",
      key: "accessDate",
      width: 180,
      render: (text, record) => {
        if (record.isTotal) return "-";
        return text ? f.dateTime(new Date(text)) : "-";
      },
    },
    {
      title: t("dateOfRegistration"),
      dataIndex: "dateOfRegistration",
      key: "dateOfRegistration",
      width: 180,
      render: (text, record) => {
        if (record.isTotal) return "-";
        return text ? f.dateTime(new Date(text)) : "-";
      },
    },
  ];

  const onChange: TableProps<DirectMember & { isTotal?: boolean; key: string | number }>["onChange"] = (
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
              <span>{t("directMemberList")}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm">{currentTime}</span>
                <Button
                  type="text"
                  icon={<ReloadOutlined />}
                  onClick={handleRefresh}
                  size="small"
                />
                <Button
                  type="primary"
                  icon={<UserAddOutlined />}
                  onClick={handleDirectMemberRegistration}
                >
                  {t("directMemberRegistration")}
                </Button>
              </div>
            </div>
          }
          classNames={{
            body: "!p-0",
          }}
        >
          <Space className="p-2 !w-full" direction="vertical">
            {/* Member Category Tabs */}
            <Space wrap>
              <Radio.Group
                size="small"
                optionType="button"
                buttonStyle="solid"
                value={typeFilter}
                onChange={(e) => onTypeChange(e.target.value)}
                options={[
                  { label: t("all"), value: "" },
                  { label: t("general"), value: "G" },
                  { label: t("test"), value: "T" },
                  { label: t("working"), value: "W" },
                  { label: t("interest"), value: "I" },
                ]}
              />
              <Radio.Group
                size="small"
                optionType="button"
                buttonStyle="solid"
                value={statusFilter}
                onChange={(e) => onStatusChange(e.target.value)}
                options={[
                  { label: t("all"), value: "" },
                  { label: t("approved"), value: "A" },
                  { label: t("suspened"), value: "S" },
                  { label: t("deleted"), value: "D" },
                  { label: t("blocked"), value: "B" },
                  { label: t("inactive"), value: "I" },
                  { label: t("pending"), value: "P" },
                ]}
              />
            </Space>

            {/* Search and Filter Section */}
            <Space className="!w-full justify-between" wrap>
              <Space wrap>
                <RangePicker
                  size="small"
                  value={dateRange}
                  onChange={onDateRangeChange}
                  format="YYYY-MM-DD"
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
              <Select
                size="small"
                value={pageSize}
                onChange={(value) => {
                  setPageSize(value);
                  setCurrentPage(1);
                }}
                style={{ width: 100 }}
                options={[
                  { label: "25", value: 25 },
                  { label: "50", value: 50 },
                  { label: "100", value: 100 },
                  { label: "250", value: 250 },
                  { label: "500", value: 500 },
                ]}
              />
            </Space>
          </Space>
          <Table<DirectMember & { isTotal?: boolean; key: string | number }>
            columns={columns}
            loading={loading}
            dataSource={tableData}
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
            rowClassName={(record) => {
              return record.isTotal ? "bg-gray-100 font-bold" : "";
            }}
          />
        </Card>
        <DirectMemberRegistrationModal
          open={isRegistrationModalOpen}
          onClose={() => setIsRegistrationModalOpen(false)}
          onSuccess={handleRegistrationSuccess}
        />
      </Content>
    </Layout>
  );
}
