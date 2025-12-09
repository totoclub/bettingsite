"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import * as XLSX from 'xlsx';

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
} from "antd";
import type { TableProps } from "antd";

import { Content } from "antd/es/layout/layout";
import { useTranslations } from "next-intl";
import { RxLetterCaseToggle } from "react-icons/rx";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { isValidDate, formatNumber } from "@/lib";
import { partnerBettingAPI, PartnerMiniGameBet } from "@/api/partnerBettingAPI";

const MiniGame: React.FC = () => {
  const t = useTranslations();

  const [total, setTotal] = useState<number>(0);
  const [transactions, setTransactions] = useState<PartnerMiniGameBet[]>([]);
  const [searchValue, setSearchValue] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("entire");
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [caseSensitive, setCaseSensitive] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  const filtersRef = useRef({ statusFilter, dateRange, searchValue });

  useEffect(() => {
    filtersRef.current = { statusFilter, dateRange, searchValue };
  }, [statusFilter, dateRange, searchValue]);

  const popupWindow = (id: number) => {
    window.open(`/partner/popup/user?id=${id}`, '_blank', 'width=screen.width,height=screen.height,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no');
  }

  const loadMiniGameBets = useCallback(async () => {
    setLoading(true);
    try {
      const currentFilters = filtersRef.current;
      const dateFrom = currentFilters.dateRange?.[0]?.startOf('day').toISOString() || "";
      const dateTo = currentFilters.dateRange?.[1]?.endOf('day').toISOString() || "";
      
      const result = await partnerBettingAPI.getMiniGameBets({
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
        status: currentFilters.statusFilter && currentFilters.statusFilter !== "entire" ? currentFilters.statusFilter : "",
        date_from: dateFrom,
        date_to: dateTo,
        search: currentFilters.searchValue || "",
      });

      if (result.status) {
        setTransactions(result.data.map((t: PartnerMiniGameBet) => ({ ...t, key: t.id })));
        setTotal(result.total);
      }
    } catch (error) {
      console.error("Error loading mini game bets:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    loadMiniGameBets();
  }, [loadMiniGameBets]);

  // Auto-refresh data every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadMiniGameBets();
    }, 10000);
    return () => clearInterval(interval);
  }, [loadMiniGameBets]);

  const onStatusChange = (v: string = "") => {
    setStatusFilter(v);
    setCurrentPage(1);
  };

  const columns: TableProps<PartnerMiniGameBet>["columns"] = [
    {
      title: t("number"),
      dataIndex: "id", 
      key: "id",
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1
    },
    {
      title: t("userid"),
      dataIndex: "level",
      key: "level",
      fixed: "left",
      render: (_, record) => {
        return (
          <div className="flex items-center cursor-pointer" onClick={() => popupWindow(record.user?.id || 0)}>
            <p className="w-[15px] h-[15px] flex items-center justify-center rounded-full bg-[#1677ff] text-white text-xs">
              {record.user?.profile?.level || 0}
            </p>
            <p className="text-xs text-[white] bg-[#000] px-1 py-0.5 rounded">
              {record.user?.profile?.name || ""}
            </p>
          </div>
        );
      },
    },
    {
      title: t("nickname"),
      dataIndex: "profile.nickname",
      key: "profile.nickname",
      render: (_, record) => record.user?.profile?.nickname || "",
    },
    {
      title: t("phone"),
      dataIndex: "profile.phone",
      key: "profile.phone",
      render: (_, record) => record.user?.profile?.phone || "",
    },
    {
      title: "Transaction ID",
      dataIndex: "id",
      key: "id",
      render: (_, record) => record.id,
    },
    {
      title: t("amount"),
      dataIndex: "amount",
      key: "amount",
      render: (_, record) => formatNumber(Math.abs(record.amount)),
    },
    {
      title: "Before Amount",
      dataIndex: "beforeAmount",
      key: "beforeAmount",
      render: (_, record) => formatNumber(record.beforeAmount),
    },
    {
      title: "After Amount",
      dataIndex: "afterAmount",
      key: "afterAmount",
      render: (_, record) => formatNumber(record.afterAmount),
    },
    {
      title: t("transactionAt"),
      dataIndex: "bettingTime",
      key: "bettingTime",
      render: (v) => {
        if (!v) return "";
        return dayjs(v * 1000).format("M/D/YYYY HH:mm:ss");
      },
    },
    {
      title: t("createdAt"),
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v) => (isValidDate(v) ? dayjs(v).format("M/D/YYYY HH:mm:ss") : ""),
    },
    {
      title: t("updatedAt"),
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (v) => (isValidDate(v) ? dayjs(v).format("M/D/YYYY HH:mm:ss") : ""),
    },
    {
      title: t("status"),
      dataIndex: "status",
      key: "status",
      fixed: "right",
      render: (_, record) => {
        return (
          <div className="text-xs">
            {record.afterAmount > record.beforeAmount && (
              <span className="bg-green-500 text-white px-2 py-1 rounded">{t("won")}</span>
            )}
            {record.afterAmount < record.beforeAmount && (
              <span className="bg-red-500 text-white px-2 py-1 rounded">{t("lost")}</span>
            )}
          </div>
        );
      }
    },
  ];

  const onChange: TableProps<PartnerMiniGameBet>["onChange"] = (
    pagination,
    filters,
    sorter,
    extra
  ) => {
    if (pagination.current) {
      setCurrentPage(pagination.current);
    }
    if (pagination.pageSize) {
      setPageSize(pagination.pageSize);
    }
  };

  const onRangerChange = (
    dates: (Dayjs | null)[] | null,
    dateStrings: string[]
  ) => {
    setDateRange(dates ? [dates[0], dates[1]] : null);
    setCurrentPage(1);
  };

  const onSearch = (value: string) => {
    setSearchValue(value);
    setCurrentPage(1);
  };

  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const currentFilters = filtersRef.current;
      const dateFrom = currentFilters.dateRange?.[0]?.startOf('day').toISOString() || "";
      const dateTo = currentFilters.dateRange?.[1]?.endOf('day').toISOString() || "";
      
      const result = await partnerBettingAPI.getMiniGameBets({
        limit: 10000,
        offset: 0,
        status: currentFilters.statusFilter && currentFilters.statusFilter !== "entire" ? currentFilters.statusFilter : "",
        date_from: dateFrom,
        date_to: dateTo,
        search: currentFilters.searchValue || "",
      });

      const allTransactions = result.data || [];

      const worksheet = XLSX.utils.json_to_sheet(
        allTransactions.map((transaction: any) => ({
          [t("number")]: transaction.id,
          [t("level")]: `${transaction.user?.profile?.level || 0} ${transaction.user?.profile?.name || ""}`,
          [t("nickname")]: transaction.user?.profile?.nickname || "",
          [t("phone")]: transaction.user?.profile?.phone || "",
          "Transaction ID": transaction.id,
          [t("amount")]: Math.abs(transaction.amount),
          "Before Amount": transaction.beforeAmount,
          "After Amount": transaction.afterAmount,
          [t("transactionAt")]: transaction.bettingTime ? dayjs(transaction.bettingTime * 1000).format("M/D/YYYY HH:mm:ss") : "",
          [t("createdAt")]: transaction.createdAt ? dayjs(transaction.createdAt).format("M/D/YYYY HH:mm:ss") : "",
          [t("updatedAt")]: transaction.updatedAt ? dayjs(transaction.updatedAt).format("M/D/YYYY HH:mm:ss") : "",
          [t("status")]: transaction.status,
        }))
      );

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Mini Game Bets");

      XLSX.writeFile(workbook, "mini_game_bets.xlsx");
    } catch (error) {
      console.error("Error downloading mini game bets:", error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Layout>
      <Content className="overflow-auto h-[calc(100vh-100px)] dark:bg-black">
        <Card
          title={t("miniGameBettingStatus")}
          classNames={{
            body: "!p-0",
          }}
        >
          <Space className="p-2 !w-full" direction="vertical">
            <Space className="!w-full justify-between">
              <Space>
                <DatePicker.RangePicker
                  size="small"
                  value={dateRange}
                  onChange={onRangerChange}
                />
                <Input.Search
                  size="small"
                  placeholder="Nickname, Phone, Transaction ID"
                  value={searchValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchValue(value);
                    if (!value) {
                      onSearch("");
                    }
                  }}
                  suffix={
                    <Button
                      size="small"
                      type="text"
                      icon={<RxLetterCaseToggle />}
                      onClick={() => setCaseSensitive(!caseSensitive)}
                      style={{
                        backgroundColor: caseSensitive ? '#1677ff' : 'transparent',
                        color: caseSensitive ? 'white' : 'inherit'
                      }}
                      title={caseSensitive ? t("caseSensitiveOn") : t("caseSensitiveOff")}
                    />
                  }
                  enterButton={t("search")}
                  onSearch={onSearch}
                  allowClear
                />
              </Space>
              <Space.Compact className="gap-1">
                <Button size="small" type="primary" onClick={handleDownload} loading={downloading || loading}>
                  {t("download")}
                </Button>
              </Space.Compact>
            </Space>
          </Space>

          <Table<PartnerMiniGameBet>
            columns={columns}
            loading={loading}
            dataSource={transactions ?? []}
            className="w-full"
            size="small"
            scroll={{ x: "max-content" }}
            onChange={onChange}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              showTotal(total, range) {
                return t("paginationLabel", {
                  from: range[0],
                  to: range[1],
                  total,
                });
              },
              total: total,
              showSizeChanger: true,
              defaultPageSize: 25,
              pageSizeOptions: [25, 50, 100, 250, 500, 1000],
            }}
          />
        </Card>
      </Content>
    </Layout>
  );
};

export default MiniGame;
