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
  Divider,
  Descriptions,
  Alert,
} from "antd";
import { FilterDropdown } from "@refinedev/antd";
import type { TableProps } from "antd";

import { Content } from "antd/es/layout/layout";
import { useFormatter, useTranslations } from "next-intl";
import { useQuery } from "@apollo/client";
import {
  FILTER_TRANSACTIONS,
} from "@/actions/transaction";
import { RxLetterCaseToggle } from "react-icons/rx";
import dayjs, { Dayjs } from "dayjs";
import { isValidDate, parseTableOptions, formatNumber } from "@/lib";
import * as XLSX from 'xlsx';
import { usePageTitle } from "@/hooks/usePageTitle";

const IntegratedTransferPage: React.FC = () => {
  usePageTitle("Admin - Integrated Transfer History Page");
  const t = useTranslations();
  const f = useFormatter();
  const [caseSensitive, setCaseSensitive] = useState<boolean>(false);
  const [tableOptions, setTableOptions] = useState<any>({
    filters: [
      {
        and: [
          {
            or: [
              {
                field: "transactions.type",
                value: "DepositCasino",
                op: "eq",
              },
              {
                field: "transactions.type",
                value: "WithdrawalCasino",
                op: "eq",
              },
              {
                field: "transactions.type",
                value: "bet",
                op: "eq",
              },
              {
                field: "transactions.type",
                value: "win",
                op: "eq",
              },
              {
                field: "transactions.type",
                value: "deposit",
                op: "eq",
              },
              {
                field: "transactions.type",
                value: "minigame_place",
                op: "eq",
              },
              {
                field: "transactions.type",
                value: "minigame_Win",
                op: "eq",
              },
              {
                field: "transactions.type",
                value: "point",
                op: "eq",
              },
              {
                field: "transactions.type",
                value: "rollingExchange",
                op: "eq",
              },
              {
                field: "transactions.type",
                value: "pointDeposit",
                op: "eq",
              },
              {
                field: "transactions.type",
                value: "directDeposit",
                op: "eq"
              },
              {
                field: "transactions.type",
                value: "directWithdraw",
                op: "eq"
              }
            ],
          },
        ],
      },
    ],
  });
  const [range, setRange] = useState<any[]>([]);

  const [total, setTotal] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const { loading, data, refetch } = useQuery(FILTER_TRANSACTIONS);

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

  const popupWindow = (id: number) => { 
    window.open(`/admin/popup/user?id=${id}`, '_blank', 'width=screen.width,height=screen.height,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no');
  }

  const columns: TableProps<Transaction>["columns"] = [
    {
      title: "ID",
      dataIndex: "userid",
      key: "userid",
      render: (_, record) => {
        return record.user.id;
      },
      filterDropdown: (props) => (
        <FilterDropdown {...props}>
          <Input className="w-full" />
        </FilterDropdown>
      ),
    },
    {
      title: t("root_dist"),
      dataIndex: "root.transactionid",
      key: "root.transactionid",
      render(_, record) {
        return record.user?.root?.userid ? (
          <div className="flex items-center cursor-pointer" onClick={() => popupWindow(record.user?.root?.id)}>
          <p className="text-xs text-[white] bg-[#000] px-1 py-0.5 rounded">{record.user?.root?.userid}</p>
        </div>) : ""
      },
    },
    {
      title: t("top_dist"),
      dataIndex: "top_dist",
      key: "top_dist",
      render(_, record) {
        return record.user?.parent?.userid ? (
          <div className="flex items-center cursor-pointer" onClick={() => popupWindow(record.user?.parent?.id)}>
          <p className="text-xs text-[white] bg-[#000] px-1 py-0.5 rounded">{record.user?.parent?.userid}</p>
        </div>) : ""
      },
    },
    {
      title: t("userid"),
      dataIndex: "userid",
      key: "userid",
      render: (_, record) => {
        return <div className="flex items-center cursor-pointer" onClick={() => popupWindow(record.user?.id)}>
          <p className="w-[15px] h-[15px] flex items-center justify-center rounded-full bg-[#1677ff] text-white text-xs">{record.user?.profile?.level}</p>
          <p className="text-xs text-[white] bg-[#000] px-1 py-0.5 rounded">{record.user?.profile?.name}</p>
        </div>
      },
    },
    {
      title: t("nickname"),
      dataIndex: "profile.nickname",
      key: '"Profile"."nickname"',
      render: (_, record) => record.user?.profile?.nickname,
      filterDropdown: (props) => (
        <FilterDropdown {...props}>
          <Input className="w-full" />
        </FilterDropdown>
      ),
    },
    {
      title: t("amount"),
      dataIndex: "amount",
      key: "amount",
      render: (value) => formatNumber(value || 0),
    },
    {
      title: t("balanceBefore"),
      dataIndex: "balanceBefore",
      key: "balanceBefore",
      render: (value) => formatNumber(value || 0),
    },
    {
      title: t("balanceAfter"),
      dataIndex: "balanceAfter",
      key: "balanceAfter",
      render: (value) => formatNumber(value || 0),
    },
    {
      title: t("explation"),
      dataIndex: "shortcut",
      key: "explation",
      render: (text, record) => {
        const getTypeColor = (type: string) => {
          const colorMap: { [key: string]: { bg: string; text: string } } = {
            deposit: { bg: "#10b981", text: "#ffffff" }, // green
            withdrawal: { bg: "#ef4444", text: "#ffffff" }, // red
            transfer: { bg: "#3b82f6", text: "#ffffff" }, // blue
            bettingSettlement: { bg: "#8b5cf6", text: "#ffffff" }, // purple
            "betting/placingBet": { bg: "#f59e0b", text: "#ffffff" }, // amber
            DepositCasino: { bg: "#06b6d4", text: "#ffffff" }, // cyan
            WithdrawalCasino: { bg: "#ec4899", text: "#ffffff" }, // pink
            point: { bg: "#84cc16", text: "#ffffff" }, // lime
            rollingExchange: { bg: "#f97316", text: "#ffffff" }, // orange
            pointDeposit: { bg: "#14b8a6", text: "#ffffff" }, // teal
            Rolling: { bg: "#a855f7", text: "#ffffff" }, // violet
            bet: { bg: "#dc2626", text: "#ffffff" }, // red-600
            win: { bg: "#16a34a", text: "#ffffff" }, // green-600
            directDeposit: { bg: "#059669", text: "#ffffff" }, // emerald-600
            directWithdraw: { bg: "#be123c", text: "#ffffff" }, // rose-700
            minigame_place: { bg: "#ea580c", text: "#ffffff" }, // orange-600
            minigame_Win: { bg: "#65a30d", text: "#ffffff" }, // lime-600
          };
          return colorMap[type] || { bg: "#6b7280", text: "#ffffff" }; // default gray
        };

        const color = getTypeColor(record.type);
        
        return (
          <div>
            {record.type === "deposit" && (
              <span style={{ backgroundColor: color.bg, color: color.text }} className="px-2 py-1 rounded text-xs font-medium">
                {t("deposit")}
              </span>
            )}
            {record.type === "withdrawal" && (
              <span style={{ backgroundColor: color.bg, color: color.text }} className="px-2 py-1 rounded text-xs font-medium">
                {t("withdrawal")}
              </span>
            )}
            {record.type === "transfer" && (
              <span style={{ backgroundColor: color.bg, color: color.text }} className="px-2 py-1 rounded text-xs font-medium">
                {t("transfer")}
              </span>
            )}
            {record.type === "bettingSettlement" && (
              <span style={{ backgroundColor: color.bg, color: color.text }} className="px-2 py-1 rounded text-xs font-medium">
                {t("bettingSettlement")}
              </span>
            )}
            {record.type === "betting/placingBet" && (
              <span style={{ backgroundColor: color.bg, color: color.text }} className="px-2 py-1 rounded text-xs font-medium">
                {t("bettingPlacement")}
              </span>
            )}
            {record.type === "DepositCasino" && (
              <span style={{ backgroundColor: color.bg, color: color.text }} className="px-2 py-1 rounded text-xs font-medium">
                {t("depositCasino")}
              </span>
            )}
            {record.type === "WithdrawalCasino" && (
              <span style={{ backgroundColor: color.bg, color: color.text }} className="px-2 py-1 rounded text-xs font-medium">
                {t("withdrawalCasino")}
              </span>
            )}
            {record.type === "point" && (
              <span style={{ backgroundColor: color.bg, color: color.text }} className="px-2 py-1 rounded text-xs font-medium">
                {t("point")}
              </span>
            )}
            {record.type === "rollingExchange" && (
              <span style={{ backgroundColor: color.bg, color: color.text }} className="px-2 py-1 rounded text-xs font-medium">
                {t("rollingExchange")}
              </span>
            )}
            {record.type === "pointDeposit" && (
              <span style={{ backgroundColor: color.bg, color: color.text }} className="px-2 py-1 rounded text-xs font-medium">
                {t("pointDeposit")}
              </span>
            )}
            {
              record.type === "Rolling" && (
                <span style={{ backgroundColor: color.bg, color: color.text }} className="px-2 py-1 rounded text-xs font-medium">
                  {t("rolling")}
                </span>
              )
            }
            {record.type === "bet" && (
              <span style={{ backgroundColor: color.bg, color: color.text }} className="px-2 py-1 rounded text-xs font-medium">
                {t("casinoBet")}
              </span>
            )}
            {record.type === "win" && (
              <span style={{ backgroundColor: color.bg, color: color.text }} className="px-2 py-1 rounded text-xs font-medium">
                {t("casinoWin")}
              </span>
            )}
            {record.type === "directDeposit" && (
              <span style={{ backgroundColor: color.bg, color: color.text }} className="px-2 py-1 rounded text-xs font-medium">
                {t("directDeposit")}
              </span>
            )}
            {record.type === "directWithdraw" && (
              <span style={{ backgroundColor: color.bg, color: color.text }} className="px-2 py-1 rounded text-xs font-medium">
                {t("directWithdraw")}
              </span>
            )}
            {record.type === "minigame_place" && (
              <span style={{ backgroundColor: color.bg, color: color.text }} className="px-2 py-1 rounded text-xs font-medium">
                {t("miniGamePlace")}
              </span>
            )}
            {record.type === "minigame_Win" && (
              <span style={{ backgroundColor: color.bg, color: color.text }} className="px-2 py-1 rounded text-xs font-medium">
                {t("miniGameWin")}
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: t("transactionAt"),
      dataIndex: "transactionAt",
      key: "transactionAt",
      render: (_, record) => {
        return dayjs(record.transactionAt).format("M/D/YYYY HH:mm:ss");
      }
    }
  ];

  const onChange: TableProps<Transaction>["onChange"] = (
    pagination,
    filters,
    sorter,
    extra
  ) => {
    setTableOptions(parseTableOptions(pagination, filters, sorter, extra));
  };

  const updateFilter = (field: string, v: string, op: string = "eq") => {
    let filters: { field: string; value: string; op: string }[] =
      tableOptions?.filters ?? [];
    filters = filters.filter((f) => f.field !== field);
    if (v) {
      filters = [
        ...filters,
        {
          field: field,
          value: v,
          op: op,
        },
      ];
    }
    setTableOptions({ ...tableOptions, filters });
  };


  const onRangerChange = (
    dates: (Dayjs | null)[] | null,
    dateStrings: string[]
  ) => {
    setRange(dateStrings);
    let filters: { field: string; value: string; op: string }[] =
      tableOptions?.filters ?? [];
    
    // Remove any existing date filters
    filters = filters.filter((f) => f.field !== "transactions.created_at");
    
    // Only add date filters if both dates are selected and valid
    if (dates?.[0] && dates?.[1]) {
      const startDate = dates[0].startOf('day').toISOString();
      const endDate = dates[1].endOf('day').toISOString();
      
      filters = [
        ...filters,
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
      ];
    }
    
    setTableOptions({ ...tableOptions, filters });
    refetch({ options: { filters } });
  };

  const onLevelChange = (v: string = "") => {
    updateFilter(`profiles.level`, v, "eq");
  };

  const onSearch = (value: string) => {
    let filters: { field: string; value: string; op: string }[] =
      tableOptions?.filters ?? [];

    // Remove any existing search filters
    filters = filters.filter(
      (f) =>
        !f.field.startsWith("transactions.profile.nickname") &&
        !f.field.startsWith("transactions.profile.holderName") &&
        !f.field.startsWith("transactions.profile.phone")
    );

    if (value) {
      // Add new search filters
      filters = [
        ...filters,
        {
          field: "transactions.profile.nickname",
          value: value,
          op: "like",
        },
        {
          field: "transactions.profile.phone",
          value: value,
          op: "like",
        },
        {
          field: "transactions.profile.holderName",
          value: value,
          op: "like",
        }
      ];
    }

    setTableOptions({ ...tableOptions, filters });
    refetch({ options: { filters } });
  };

  const handleDownload = () => {
    // Create worksheet from transactions data
    const worksheet = XLSX.utils.json_to_sheet(
      transactions.map((transaction) => ({
        [t("number")]: transaction.id,
        [t("root_dist")]: transaction.user?.root?.userid,
        [t("top_dist")]: transaction.user?.parent?.userid,
        [t("level")]: `${transaction.user?.profile?.level} ${transaction.user?.profile?.name}`,
        [t("nickname")]: transaction.user?.profile?.nickname,
        [t("phone")]: transaction.user?.profile?.phone,
        [t("bankName")]: transaction.user?.profile?.bankName,
        [t("accountName")]: transaction.user?.profile?.accountNumber,
        [t("depositorName")]: transaction.user?.profile?.holderName,
        [t("alliance")]: "-",
        [t("balanceBefore")]: transaction.balanceBefore,
        [t("amount")]: transaction.amount,
        [t("balanceAfter")]: transaction.balanceAfter,
        [t("pointBefore")]: transaction.pointBefore,
        [t("point")]: 0,
        [t("pointAfter")]: transaction.pointAfter,
        [t("usdtDesc")]: transaction.usdtDesc,
        [t("shortcut")]: transaction.shortcut,
        [t("transactionAt")]: transaction.transactionAt ? dayjs(transaction.transactionAt).format("M/D/YYYY HH:mm:ss") : "",
        [t("approvedAt")]: transaction.approvedAt ? dayjs(transaction.approvedAt).format("M/D/YYYY HH:mm:ss") : "",
        [t("createdAt")]: transaction.createdAt ? dayjs(transaction.createdAt).format("M/D/YYYY HH:mm:ss") : "",
        [t("status")]: transaction.status,
      }))
    );

    // Create workbook and append worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, "transactions.xlsx");
  };

  useEffect(() => {
    setTransactions(
      data?.response?.transactions?.map((u: any) => {
        return { ...u, key: u.id };
      }) ?? []
    );
    setTotal(data?.response?.total);
  }, [data]);

  useEffect(() => {
    refetch(tableOptions ?? undefined);
  }, [tableOptions]);
  return (
    <Layout>
      <Content className="overflow-auto h-[calc(100vh-100px)] dark:bg-black">
        <Card
          title={t("admin/menu/totaltransferhistory")}
          classNames={{
            body: "!p-0",
          }}
        >
          <Space className="p-2 !w-full" direction="vertical">
            <Radio.Group
              size="small"
              optionType="button"
              buttonStyle="solid"
              options={[
                {
                  label: t("all"),
                  value: "",
                },
                {
                  label: t("site"),
                  value: "site",
                },
              ]}
              defaultValue={""}
            />
            <Space wrap>
              <Radio.Group
                size="small"
                optionType="button"
                buttonStyle="solid"
                options={[
                  {
                    label: t("all"),
                    value: "",
                  },
                  {
                    label: t("depositCasino"),
                    value: "DepositCasino",
                  },
                  {
                    label: t("withdrawalCasino"),
                    value: "WithdrawalCasino",
                  },
                  {
                    label: t("bet"),
                    value: "bet",
                  },
                  {
                    label: t("win"),
                    value: "win",
                  },
                ]}
                defaultValue={""}
                onChange={(e) => updateFilter("transactions.type", e.target.value)}
              />
            </Space>
            <Space className="!w-full justify-between">
              <Space>
                <DatePicker.RangePicker
                  size="small"
                  onChange={onRangerChange}
                />
                <Input.Search
                  size="small"
                  placeholder={t("idNicknameAccountHolderPhoneNumber")}
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
                />
              </Space>
              {/* <Space.Compact className="gap-1">
                <Button size="small" type="primary" onClick={handleDownload}>
                  {t("download")}
                </Button>
              </Space.Compact> */}
            </Space>
            {/* <Divider className="!p-0 !m-0" />
            <Descriptions
              bordered
              layout="vertical"
              column={6}
              items={[
                {
                  key: "1",
                  label: t("depositToday"),
                  children: "0",
                },
                {
                  key: "2",
                  label: t("withdrawlToday"),
                  children: "0",
                },
                {
                  key: "3",
                  label: t("period"),
                  children: "0",
                },
                {
                  key: "4",
                  label: t("deposit"),
                  children: "0",
                },
                {
                  key: "5",
                  label: t("withdraw"),
                  children: "0",
                },
                {
                  key: "6",
                  label: t("deposit") + "/" + t("withdraw"),
                  children: "0",
                },
              ]}
            />
            <Alert
              message={
                <span>
                  <span className="text-red-600">
                    Description: Payment/recovery of distributor money
                  </span>{" "}
                  is a process in which the distributor pays/recovers money to a
                  subordinate, and{" "}
                  <span className="text-red-600">
                    payment/recovery of subordinate money
                  </span>{" "}
                  is a process in which the upper distributor pays/recovers
                  money to the distributor.
                </span>
              }
              type="warning"
            /> */}
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

export default IntegratedTransferPage;
