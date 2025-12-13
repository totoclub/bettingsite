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
import { useQuery } from "@apollo/client";
import { FILTER_TRANSACTIONS } from "@/actions/transaction";
import { RxLetterCaseToggle } from "react-icons/rx";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { isValidDate, parseTableOptions, formatNumber } from "@/lib";

interface Transaction {
  id: string;
  userId: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  pointBefore: number;
  pointAfter: number;
  status: string;
  shortcut: string;
  usdtDesc: string;
  transactionAt: string;
  approvedAt: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
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

const MiniGame: React.FC = () => {
  const t = useTranslations();
  const f = useFormatter();

  const [range, setRange] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchValue, setSearchValue] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("entire");
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [caseSensitive, setCaseSensitive] = useState<boolean>(false);

  const popupWindow = (id: number) => {
    window.open(`/admin/popup/user?id=${id}`, '_blank', 'width=screen.width,height=screen.height,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no');
  }

  const [tableOptions, setTableOptions] = useState<any>({
    filters: [
      {
        and: [
          {
            field: "transactions.type",
            value: "minigame_place",
            op: "eq",
          },
        ],
      },
    ],
  });

  const tableOptionsRef = useRef(tableOptions);

  useEffect(() => {
    tableOptionsRef.current = tableOptions;
  }, [tableOptions]);

  const { loading, data, refetch } = useQuery(FILTER_TRANSACTIONS, {
    variables: {
      filters: tableOptions?.filters,
      orders: tableOptions?.orders,
      pagination: tableOptions?.pagination,
    },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      refetch({
        filters: tableOptionsRef.current?.filters,
        orders: tableOptionsRef.current?.orders,
        pagination: tableOptionsRef.current?.pagination,
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [refetch]);

  useEffect(() => {
    setTransactions(
      data?.response?.transactions?.map((u: any) => {
        return { ...u, key: u.id };
      }) ?? []
    );
    setTotal(data?.response?.total || 0);
  }, [data]);

  useEffect(() => {
    refetch({
      filters: tableOptions?.filters,
      orders: tableOptions?.orders,
      pagination: tableOptions?.pagination,
    });
  }, [tableOptions]);

  const onStatusChange = (v: string = "") => {
    setStatusFilter(v);
    let filters: any[] = [
      {
        and: [
          {
            field: "transactions.type",
            value: "minigame_place",
            op: "eq",
          },
        ],
      },
    ];

    if (v && v !== "entire") {
      filters[0].and.push({
        field: "transactions.status",
        value: v,
        op: "eq",
      });
    }

    setTableOptions({ ...tableOptions, filters });
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

  const columns: TableProps<Transaction>["columns"] = [
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
      title: "Level",
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
      filterDropdown: (props) => (
        <FilterDropdown {...props}>
          <Input className="w-full" />
        </FilterDropdown>
      ),
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
      dataIndex: "balanceBefore",
      key: "balanceBefore",
      render: (_, record) => formatNumber(record.balanceBefore),
    },
    {
      title: "After Amount",
      dataIndex: "balanceAfter",
      key: "balanceAfter",
      render: (_, record) => formatNumber(record.balanceAfter),
    },
    {
      title: t("transactionAt"),
      dataIndex: "transactionAt",
      key: "transactionAt",
      render: (v) =>
        isValidDate(v)
          ? dayjs(v).format("M/D/YYYY HH:mm:ss")
          : "",
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
        return <div className="text-xs">
          {record.balanceAfter > record.balanceBefore && <span className="bg-green-500 text-white px-2 py-1 rounded">{t("won")}</span>}
          {record.balanceAfter < record.balanceBefore && <span className="bg-red-500 text-white px-2 py-1 rounded">{t("lost")}</span>}
        </div>
      }
    },
  ];

  const onChange: TableProps<Transaction>["onChange"] = (
    pagination,
    filters,
    sorter,
    extra
  ) => {
    setTableOptions(parseTableOptions(pagination, filters, sorter, extra));
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
    let filters: any[] = [
      {
        and: [
          {
            field: "transactions.type",
            value: "minigame_place",
            op: "eq",
          },
        ],
      },
    ];
    
    // Add status filter if set
    if (statusFilter && statusFilter !== "entire") {
      filters[0].and.push({
        field: "transactions.status",
        value: statusFilter,
        op: "eq",
      });
    }
    
    // Only add date filters if both dates are selected and valid
    if (dates?.[0] && dates?.[1]) {
      const startDate = dates[0].startOf('day').toISOString();
      const endDate = dates[1].endOf('day').toISOString();
      
      // Create OR condition for date range
      const dateOrCondition = {
        or: [
          {
            field: "transactions.created_at",
            value: startDate,
            op: "gte",
          },
          {
            field: "transactions.created_at",
            value: endDate,
            op: "lte",
          },
        ]
      };

      filters[0].and.push(dateOrCondition);
    }
    
    setTableOptions({ ...tableOptions, filters });
  };

  const onSearch = (value: string) => {
    setSearchValue(value);
    let filters: any[] = [
      {
        and: [
          {
            field: "transactions.type",
            value: "minigame_place",
            op: "eq",
          },
        ],
      },
    ];

    // Add status filter if set
    if (statusFilter && statusFilter !== "entire") {
      filters[0].and.push({
        field: "transactions.status",
        value: statusFilter,
        op: "eq",
      });
    }

    if (value) {
      // Determine the search operator based on case sensitivity
      const searchOp = caseSensitive ? "like" : "ilike";
      
      // Create OR condition for multiple search fields
      const searchOrCondition = {
        or: [
          {
            field: "profiles.nickname",
            value: value,
            op: searchOp,
          },
          {
            field: "profiles.phone",
            value: value,
            op: searchOp,
          },
          {
            field: "transactions.id",
            value: value,
            op: searchOp,
          },
        ]
      };

      filters[0].and.push(searchOrCondition);
    }

    setTableOptions({ ...tableOptions, filters });
  };

  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Fetch all data without pagination for download
      const downloadFilters = {
        ...tableOptionsRef.current,
        pagination: {
          ...tableOptionsRef.current?.pagination,
          limit: 10000, // Large limit to get all data
          offset: 0,
        },
      };
      
      const result = await refetch({
        filters: downloadFilters.filters,
        orders: downloadFilters.orders,
        pagination: downloadFilters.pagination,
      });

      const allTransactions = result.data?.response?.transactions || [];

      // Create worksheet from all transactions data
      const worksheet = XLSX.utils.json_to_sheet(
        allTransactions.map((transaction: any) => ({
          [t("number")]: transaction.id,
          [t("root_dist")]: transaction.user?.root?.userid,
          [t("top_dist")]: transaction.user?.parent?.userid,
          [t("level")]: `${transaction.user?.profile?.level} ${transaction.user?.profile?.name}`,
          [t("nickname")]: transaction.user?.profile?.nickname,
          [t("phone")]: transaction.user?.profile?.phone,
          "Transaction ID": transaction.id,
          [t("amount")]: Math.abs(transaction.amount),
          "Before Amount": transaction.balanceBefore,
          "After Amount": transaction.balanceAfter,
          [t("transactionAt")]: transaction.transactionAt ? dayjs(transaction.transactionAt).format("M/D/YYYY HH:mm:ss") : "",
          [t("createdAt")]: transaction.createdAt ? dayjs(transaction.createdAt).format("M/D/YYYY HH:mm:ss") : "",
          [t("updatedAt")]: transaction.updatedAt ? dayjs(transaction.updatedAt).format("M/D/YYYY HH:mm:ss") : "",
          [t("status")]: transaction.status,
        }))
      );

      // Create workbook and append worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Mini Game Bets");

      // Generate Excel file and trigger download
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
            <Space wrap>
              {/* <Radio.Group
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
              /> */}
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

          <Table<Transaction>
            columns={columns}
            loading={loading}
            dataSource={transactions ?? []}
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