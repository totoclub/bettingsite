"use client";
import React, { useEffect, useState, useRef } from "react";
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
import { FilterDropdown } from "@refinedev/antd";
import type { TableProps } from "antd";

import { Content } from "antd/es/layout/layout";
import { useFormatter, useTranslations } from "next-intl";
import { fetchCasinoBets, CasinoBetFilters } from "@/actions/betLog";
import { RxLetterCaseToggle } from "react-icons/rx";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { isValidDate, parseTableOptions, formatNumber } from "@/lib";

interface CasinoBet {
  id: string;
  userId: string;
  gameId: string;
  gameName: string;
  transId: string;
  bettingTime: number;
  details: any;
  betAmount: number;        // Original bet amount (negative)
  winAmount: number;        // Win amount (0 for loss, positive for win)
  netAmount: number;        // Net change (winAmount - abs(betAmount))
  resultStatus: string;     // "won", "lost", or "pending"
  beforeAmount: number;     // Balance before bet
  afterAmount: number;      // Balance after win
  status: string;           // Original status from bet record
  createdAt: string;
  updatedAt: string;
  betId: string;            // ID of bet record
  winId: string;            // ID of win record
  user: {
    id: string;
    name: string;
    userid: string;
    role: string;
    parent?: {
      id: string;
      userid: string;
    };
    root?: {
      id: string;
      userid: string;
    };
    profile: {
      id: string;
      userId: string;
      name: string;
      nickname: string;
      bankName: string;
      holderName: string;
      accountNumber: string;
      phone: string;
      mobile: string;
      balance: number;
      point: number;
      comp: number;
      level: number;
      referral: string;
      lastDeposit: string;
      lastWithdraw: string;
    };
  };
}

const CasinoLive: React.FC = () => {
  const t = useTranslations();
  const f = useFormatter();

  const [range, setRange] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [casinoBets, setCasinoBets] = useState<CasinoBet[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("entire");
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const popupWindow = (id: number) => {
    window.open(`/admin/popup/user?id=${id}`, '_blank', 'width=screen.width,height=screen.height,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no');
  }

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [filters, setFilters] = useState<CasinoBetFilters>({
    game_name_filter: "not_slot",
    limit: 25,
    offset: 0,
  });

  const filtersRef = useRef(filters);
  const searchValueRef = useRef(searchValue);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    searchValueRef.current = searchValue;
  }, [searchValue]);

  const loadCasinoBets = async () => {
    const currentFilters = filtersRef.current;
    const currentSearchValue = searchValueRef.current;
    
    setLoading(true);
    try {
      const filtersWithSearch = {
        ...currentFilters,
        search: currentSearchValue.trim() || "",
      };
      const result = await fetchCasinoBets(filtersWithSearch);
      const filteredBets = result.casinoBets.map((bet: any) => ({ ...bet, key: bet.id }));
      
      setCasinoBets(filteredBets);
      setTotal(result.total);
    } catch (error) {
      console.error("Error loading casino bets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCasinoBets();
  }, [filters, searchValue]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadCasinoBets();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const onStatusChange = (v: string = "") => {
    setStatusFilter(v);
    setFilters(prev => ({
      ...prev,
      status: v && v !== "entire" ? v : "",
      offset: 0,
    }));
    setCurrentPage(1);
  };

  const labelRenderer = (props: any) => {
    const val = parseInt(props.value.toString());
    if (val === 15) return "Premium";
    if (val === 13) return "VIP 1";
    if (val === 14) return "VIP 2";
    if (val >= 1 && val <= 12) return "Level " + val;
    return "Level " + val;
  };

  const levelOption = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
  ].map((i) => ({
    value: i,
    label:
      i === 15
        ? "Premium"
        : i === 13
        ? "VIP 1"
        : i === 14
        ? "VIP 2"
        : "Level " + i,
  }));

  const columns: TableProps<CasinoBet>["columns"] = [
    {
      title: t("number"),
      dataIndex: "id", 
      key: "id",
      render: (_, __, index) => index + 1
    },
    {
      title: t("root_dist"),
      dataIndex: "root.userid",
      key: "root.userid",
      render(_, record) {
        return record.user?.root?.userid;
      },
    },
    {
      title: t("top_dist"),
      dataIndex: "top_dist",
      key: "top_dist",
      render(_, record) {
        return record.user?.parent?.userid;
      },
    },
    {
      title: t("userid"),
      dataIndex: "level",
      key: "level",
      fixed: "left",
      render: (_, record) => {
        return <div className="flex items-center cursor-pointer" onClick={() => popupWindow(parseInt(record.user?.id))}>
          <p className="w-[15px] h-[15px] flex items-center justify-center rounded-full bg-[#1677ff] text-white text-xs">{record.user?.profile?.level}</p>
          <p className="text-xs text-[white] bg-[#000] px-1 py-0.5 rounded">{record.user?.profile?.name}</p>
        </div>
      },
    },
    {
      title: t("nickname"),
      dataIndex: "profile.nickname",
      key: "profile.nickname",
      render: (_, record) => record.user?.profile?.nickname,
    },
    {
      title: t("phone"),
      dataIndex: "profile.phone",
      key: "profile.phone",
      render: (_, record) => record.user?.profile?.phone,
    },
    {
      title: t("gameName"),
      dataIndex: "gameName",
      key: "gameName",
      render: (_, record) => {
        // Remove "|slot" or any part after "|"
        const gameName = record.gameName || "";
        return gameName.split("|")[0];
      },
    },
    {
      title: t("transId"),
      dataIndex: "transId",
      key: "transId",
      render: (_, record) => record.transId,
    },
    {
      title: t("betAmount"),
      dataIndex: "betAmount",
      key: "betAmount",
      render: (_, record) => (
        <span className="text-red-500">{formatNumber(Math.abs(record.betAmount))}</span>
      ),
    },
    {
      title: t("winAmount"),
      dataIndex: "winAmount",
      key: "winAmount",
      render: (_, record) => (
        <span className={record.winAmount > 0 ? "text-green-500" : "text-gray-500"}>
          {formatNumber(record.winAmount)}
        </span>
      ),
    },
    {
      title: t("netAmount"),
      dataIndex: "netAmount",
      key: "netAmount",
      render: (_, record) => (
        <span className={record.netAmount > 0 ? "text-green-500" : record.netAmount < 0 ? "text-red-500" : "text-gray-500"}>
          {formatNumber(record.netAmount)}
        </span>
      ),
    },
    {
      title: t("beforeAmount"),
      dataIndex: "beforeAmount",
      key: "beforeAmount",
      render: (_, record) => formatNumber(record.beforeAmount),
    },
    {
      title: t("afterAmount"),
      dataIndex: "afterAmount",
      key: "afterAmount",
      render: (_, record) => formatNumber(record.afterAmount),
    },
    {
      title: t("bettingTime"),
      dataIndex: "bettingTime",
      key: "bettingTime",
      render: (_, record) => {
        if (!record.bettingTime) return "-";
        // Convert Unix timestamp (seconds) to milliseconds and format
        const date = dayjs(record.bettingTime * 1000);
        return date.format("M/D/YYYY HH:mm");
      },
    },
    // {
    //   title: "Details",
    //   dataIndex: "details",
    //   key: "details",
    //   render: (_, record) => (
    //     <div className="max-w-xs overflow-hidden text-ellipsis">
    //       {record.details ? JSON.stringify(record.details) : '-'}
    //     </div>
    //   ),
    // },
    // {
    //   title: t("createdAt"),
    //   dataIndex: "createdAt",
    //   key: "createdAt",
    //   render: (v) => (isValidDate(v) ? f.dateTime(new Date(v)) : ""),
    // },
    // {
    //   title: t("updatedAt"),
    //   dataIndex: "updatedAt",
    //   key: "updatedAt",
    //   render: (v) => (isValidDate(v) ? f.dateTime(new Date(v)) : ""),
    // },
    {
      title: t("status"),
      dataIndex: "resultStatus",
      key: "resultStatus",
      fixed: "right",
      render: (_, record) => {
        return <div className="text-xs">
          {record.resultStatus === "won" && <span className="bg-green-500 text-white px-2 py-1 rounded">{t("won")}</span>}
          {record.resultStatus === "lost" && <span className="bg-red-500 text-white px-2 py-1 rounded">{t("lost")}</span>}
          {record.resultStatus === "pending" && <span className="bg-yellow-500 text-white px-2 py-1 rounded">{t("pending")}</span>}
          {record.status === "cancelled" && <span className="bg-gray-500 text-white px-2 py-1 rounded">{t("cancelled")}</span>}
          {!["won", "lost", "pending"].includes(record.resultStatus) && record.status !== "cancelled" && (
            <span className="bg-blue-500 text-white px-2 py-1 rounded">{record.resultStatus || record.status}</span>
          )}
        </div>
      }
    },
  ];

  const onChange: TableProps<CasinoBet>["onChange"] = (
    pagination,
    filters,
    sorter,
    extra
  ) => {
    if (pagination) {
      const newPage = pagination.current || 1;
      const newPageSize = pagination.pageSize || 25;
      
      setCurrentPage(newPage);
      setPageSize(newPageSize);
      setFilters(prev => ({
        ...prev,
        limit: newPageSize,
        offset: (newPage - 1) * newPageSize,
      }));
    }
  };

  const onLevelChange = (v: string = "") => {
    // Level filtering would need to be implemented in the backend API
    // For now, we'll skip this functionality
    console.log("Level filter not yet implemented:", v);
  };

  const onRangerChange = (
    dates: (Dayjs | null)[] | null,
    dateStrings: string[]
  ) => {
    setRange(dateStrings);
    setDateRange(dates ? [dates[0], dates[1]] : null);
    
    if (dates?.[0] && dates?.[1]) {
      const startDate = dates[0].startOf('day').toISOString();
      const endDate = dates[1].endOf('day').toISOString();
      
      setFilters(prev => ({
        ...prev,
        date_from: startDate,
        date_to: endDate,
        offset: 0,
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        date_from: "",
        date_to: "",
        offset: 0,
      }));
    }
    
    setCurrentPage(1);
  };

  const onSearch = (value: string) => {
    setSearchValue(value);
    setCurrentPage(1);
    // Reset offset when searching
    setFilters(prev => ({
      ...prev,
      search: value.trim() || "",
      offset: 0,
    }));
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      // Fetch all data without pagination for download
      const downloadFilters = {
        ...filtersRef.current,
        limit: 10000, // Large limit to get all data
        offset: 0,
        search: searchValueRef.current.trim() || "",
      };
      
      const result = await fetchCasinoBets(downloadFilters);
      const allBets = result.casinoBets;

      // Create worksheet from all casino bets data
      const worksheet = XLSX.utils.json_to_sheet(
        allBets.map((bet: any) => ({
          [t("number")]: bet.id,
          [t("root_dist")]: bet.user?.root?.userid,
          [t("top_dist")]: bet.user?.parent?.userid,
          [t("level")]: `${bet.user?.profile?.level} ${bet.user?.profile?.name}`,
          [t("nickname")]: bet.user?.profile?.nickname,
          [t("phone")]: bet.user?.profile?.phone,
          [t("gameName")]: bet.gameName?.split("|")[0] || bet.gameName,
          [t("transId")]: bet.transId,
          [t("betAmount")]: Math.abs(bet.betAmount),
          [t("winAmount")]: bet.winAmount,
          [t("netAmount")]: bet.netAmount,
          "Result Status": bet.resultStatus,
          [t("beforeAmount")]: bet.beforeAmount,
          [t("afterAmount")]: bet.afterAmount,
          [t("bettingTime")]: bet.bettingTime ? dayjs(bet.bettingTime * 1000).format("M/D/YYYY HH:mm") : "",
          Status: bet.status,
          // [t("createdAt")]: bet.createdAt ? dayjs(bet.createdAt).format("M/D/YYYY HH:mm") : "",
          // [t("updatedAt")]: bet.updatedAt ? dayjs(bet.updatedAt).format("M/D/YYYY HH:mm") : "",
          Details: bet.details ? JSON.stringify(bet.details) : "",
        }))
      );

      // Create workbook and append worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Casino Live Bets");

      // Generate Excel file and trigger download
      XLSX.writeFile(workbook, "casino_live_bets.xlsx");
    } catch (error) {
      console.error("Error downloading casino bets:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Content className="overflow-auto h-[calc(100vh-100px)] dark:bg-black">
        <Card
          title={t("casinoLiveBettingStatus")}
          classNames={{
            body: "!p-0",
          }}
        >
          <Space className="p-2 !w-full" direction="vertical">
            <Space wrap>
              <Radio.Group
                size="small"
                optionType="button"
                buttonStyle="solid"
                value={statusFilter}
                options={[
                  {
                    label: t("entire"),
                    value: "entire",
                  },
                  {
                    label: t("won"),
                    value: "won",
                  },
                  {
                    label: t("lost"),
                    value: "lost",
                  },
                  {
                    label: t("pending"),
                    value: "pending",
                  },
                  {
                    label: t("cancelled"),
                    value: "cancelled",
                  },
                ]}
                onChange={(e) => onStatusChange(e.target.value)}
              />
            </Space>
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
                    // If cleared, trigger search immediately
                    if (!value) {
                      onSearch("");
                    }
                  }}
                  suffix={
                    <Button
                      size="small"
                      type="text"
                      icon={<RxLetterCaseToggle />}
                    />
                  }
                  enterButton={t("search")}
                  onSearch={onSearch}
                  allowClear
                />
              </Space>
              <Space.Compact className="gap-1">
                <Button size="small" type="primary" onClick={handleDownload} loading={loading}>
                  {t("download")}
                </Button>
              </Space.Compact>
            </Space>
          </Space>

          <Table<CasinoBet>
            columns={columns}
            loading={loading}
            dataSource={casinoBets ?? []}
            className="w-full"
            size="small"
            scroll={{ x: "max-content" }}
            onChange={onChange}
            pagination={{
              showTotal(total, range) {
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
              pageSizeOptions: [25, 50, 100, 250, 500, 1000],
            }}
          />
        </Card>
      </Content>
    </Layout>
  );
};

export default CasinoLive;
