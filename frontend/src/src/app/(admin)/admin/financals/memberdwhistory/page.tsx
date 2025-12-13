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
  Modal,
  Form,
  Divider,
  Descriptions,
  Alert,
} from "antd";
import { FilterDropdown } from "@refinedev/antd";
import type { TableProps } from "antd";

import { Content } from "antd/es/layout/layout";
import { useFormatter, useTranslations } from "next-intl";
import { useMutation, useQuery } from "@apollo/client";
import {
  APPROVE_TRANSACTION,
  FILTER_TRANSACTIONS,
  CANCEL_TRANSACTION,
  WAITING_TRANSACTION,
} from "@/actions/transaction";
import { RxLetterCaseToggle } from "react-icons/rx";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { isValidDate, parseTableOptions, formatNumber } from "@/lib";
import api from "@/api";
import { usePageTitle } from "@/hooks/usePageTitle";

const MemberDWPage: React.FC = () => {
  usePageTitle("Admin - Member Deposit Withdrawal History Page");
  const t = useTranslations();
  const f = useFormatter();
  const [tableOptions, setTableOptions] = useState<any>({
    filters: [
      {
        and: [
          {
            or: [
              {
                field: "transactions.type",
                value: "deposit",
                op: "eq",
              },
              {
                field: "transactions.type",
                value: "withdrawal",
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
            ],
          },
          {
            or: [
              {
                field: "users.role",
                value: "U",
                op: "eq",
              },
            ],
          },
        ],
      },
    ],
  });

  const popupWindow = (id: number) => {
    window.open(`/admin/popup/user?id=${id}`, '_blank', 'width=screen.width,height=screen.height,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no');
  }

  const [modal, contextHolder] = Modal.useModal();
  const [total, setTotal] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const { loading, data, refetch } = useQuery(FILTER_TRANSACTIONS);
  const [colorModal, setColorModal] = useState<boolean>(false);
  const [range, setRange] = useState<any[]>([]);
  const [caseSensitive, setCaseSensitive] = useState<boolean>(false);

  const [approveTransaction] = useMutation(APPROVE_TRANSACTION);
  const [cancelTransaction] = useMutation(CANCEL_TRANSACTION);
  const [waitingTransaction] = useMutation(WAITING_TRANSACTION);
  const tableOptionsRef = useRef<any>(null);

  // Keep ref in sync with tableOptions so interval always uses latest filters
  useEffect(() => {
    tableOptionsRef.current = tableOptions;
  }, [tableOptions]);

  useEffect(() => {
    const interval = setInterval(() => {
      refetch(tableOptionsRef.current ?? undefined);
    }, 2000);
    return () => clearInterval(interval);
  }, [refetch]);

  const onApproveTransaction = (transaction: Transaction) => {
    if (transaction.type == "deposit" || transaction.type == "withdrawal") {
      approveTransaction({ variables: { id: transaction.id } })
        .then((res) => {
          if (res.data?.success) {
            refetch(tableOptions);  
          }
        })
        .catch((err) => {
          console.error('Error approving transaction:', err);
        });
    } else if (transaction.type == "point") {
      refetch(tableOptions);  
      api("admin/point/convert", {
        method: "POST",
        data: {
          id: transaction.id,
          amount: transaction.amount,
          userId: transaction.user?.id
        },
      })
      .then((res) => {
        if (res.data?.success) {
          refetch(tableOptions);  
        }
      })
      .catch((err) => {
        console.error('Error converting point:', err);
      });
    } else if (transaction.type == "rollingExchange") {
      refetch(tableOptions);  
      api("admin/rolling/convert", {
        method: "POST",
        data: {
          id: transaction.id,
          amount: transaction.amount,
          userId: transaction.user?.id
        },
      })
      .then((res) => {
        if (res.data?.success) {
          refetch(tableOptions);  
        }
      })
      .catch((err) => {
        console.error('Error converting rollingExchange:', err);
      });
    }
  };

  const onWaitingTransaction = (transaction: Transaction) => {
    waitingTransaction({ variables: { id: transaction.id } })
      .then((res) => {
        if (res.data?.success) {
          refetch(tableOptions);
        }
      })
      .catch((err) => {
        console.error('Error waiting transaction:', err);
      });
  };

  const onCancelTransaction = (transaction: Transaction) => {
    cancelTransaction({ variables: { id: transaction.id } })
      .then((res) => {
        if (res.data?.success) {
          refetch(tableOptions);
        }
      })
      .catch((err) => {
        console.error('Error canceling transaction:', err);
      });
  };
  const onTransactionTypeChange = (v: string = "") => {
    // Base filters for all transaction types
    const baseFilters = {
      and: [
        {
          or: [
            {
              field: "transactions.type",
              value: "deposit",
              op: "eq",
            },
            {
              field: "transactions.type",
              value: "withdrawal",
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
          ],
        },
        {
          or: [
            {
              field: "users.role",
              value: "U",
              op: "eq",
            },
          ],
        },
      ],
    };

    if (v === "entire") {
      // Show all transactions
      setTableOptions({
        ...tableOptions,
        filters: [baseFilters],
      });
    } else if (v === "C") {
      // Filter for canceled status
      setTableOptions({
        ...tableOptions,
        filters: [
          {
            ...baseFilters,
            and: [
              ...baseFilters.and,
              {
                field: "transactions.status",
                value: "C",
                op: "eq",
              },
            ],
          },
        ],
      });
    } else if (v === "pending") {
      setTableOptions({
        ...tableOptions,
        filters: [
          {
            ...baseFilters,
            and: [
              ...baseFilters.and,
              {
                field: "transactions.status",
                value: "pending",
                op: "eq",
              },
            ],
          },
        ],
      });
    } else {
      // Filter for specific transaction type
      setTableOptions({
        ...tableOptions,
        filters: [
          {
            ...baseFilters,
            and: [
              ...baseFilters.and,
              {
                field: "transactions.type",
                value: v,
                op: "eq",
              },
            ],
          },
        ],
      });
    }
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
      dataIndex: "root.transactionid",
      key: "root.transactionid",
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
      title: t("nickname"),
      dataIndex: "profile.nickname",
      key: '"Profile"."nickname"',
      render: (_, record) => record.user?.profile?.nickname,
    },
    {
      title: t("phone"),
      dataIndex: "profile.phone",
      key: '"Profile"."phone"',
      render: (_, record) => record.user?.profile?.phone || "",
    },
    {
      title: t('userid'),
      dataIndex: "level",
      key: "level",
      fixed: "left",
      render: (_, record) => {
        // return (record.user?.profile?.level + " " + record.user?.profile?.name);
        return <div className="flex items-center cursor-pointer" onClick={() => popupWindow(record.user?.id)}>
          <p className="w-[15px] h-[15px] flex items-center justify-center rounded-full bg-[#1677ff] text-white text-xs">{record.user?.profile?.level}</p>
          <p className="text-xs text-[white] bg-[#000] px-1 py-0.5 rounded">{record.user?.profile?.name}</p>
        </div>
      },
    },
    {
      title: t("bankName"),
      dataIndex: "profile.bankname",
      key: "bankname",
      render: (_, record) => record.user?.profile?.bankName,
    },
    {
      title: t("accountName"),
      dataIndex: "profile.accountNumber",
      key: "accountNumber",
      render: (_, record) => record.user?.profile?.name,
    },
    {
      title: t("depositorName"),
      dataIndex: "profile.depositorName",
      key: "depositorName",
      render: (_, record) => record.user?.profile?.holderName,
    },
    {
      title: t("alliance"),
      dataIndex: "profile.alliance",
      key: "alliance",
      render: (_, record) => <p>-</p>,
    },
    {
      title: t("balanceBefore"),
      dataIndex: "balanceBefore",
      key: "balanceBefore",
      render: (_, record) => formatNumber(record.user?.profile?.balance || 0),
    },
    {
      title: t("amount"),
      dataIndex: "amount",
      key: "amount",
      render: (_, record) => {
        if (record.type == "pointDeposit") {
          return formatNumber(record.amount || 0);
        }
        return formatNumber(record.type == "point" ? 0 : 0)
      },
    },
    {
      title: t("balanceAfter"),
      dataIndex: "balanceAfter",
      key: "balanceAfter",
      render: (_, record) => {
        let balance = record.user?.profile?.balance || 0;
        if (record.type == "deposit" && record.status == "pending") {
          balance = balance + (record.amount || 0);
        } else if (record.type == "withdrawal" && record.status == "pending") {
          balance = balance - (record.amount || 0);
        } else if (record.type == "point" && record.status == "pending") {
          balance = balance;
        } else if (record.type == "rollingExchange" && record.status == "pending") {
          balance = balance + (record.amount || 0);
        }
        return formatNumber(balance);
      },
    },
   
    {
      title: t("pointBefore"),
      dataIndex: "pointBefore",
      key: "pointBefore",
      render: (_, record) => formatNumber(record.user?.profile?.point || 0),
    },
    {
      title: t("point"),
      dataIndex: "point",
      key: "point",
      render: (_, record) => {
        if (record.type == "pointDeposit") {
          return formatNumber(record.amount || 0);
        }
        return formatNumber(record.type == "point" ? (record.amount || 0) : 0)
      },
    },
    {
      title: t("pointAfter"),
      dataIndex: "pointAfter",
      key: "pointAfter",
      render: (_, record) => {
        let point = record.user?.profile?.point || 0;
        if (record.type == "point") {
          point = point - (record.amount || 0);
        } else if (record.type == "pointDeposit") {
          point = point + (record.amount || 0);
        }
        return formatNumber(point);
      },
    },
    {
      title: t("shortcut"),
      dataIndex: "shortcut",
      width: 150,
      key: "shortcut",
      render: (_, record) => (
        <>
          {record.type == "deposit" && (
            <div className="flex flex-column gap-1">
              <p className="text-xs bg-[red] text-white flex px-2 py-1 rounded justify-center align-center cursor-pointer">{t("deposit")}</p>
            </div>
          )}
          {record.type == "withdrawal" && (
            <div className="flex flex-column gap-1">
              <p className="text-xs bg-[#1677ff] text-white flex px-2 py-1 rounded justify-center align-center cursor-pointer">{t("withdrawal")}</p>
            </div>
          )}
          {record.type == "point" && (
            <div className="flex flex-column gap-1">
              <p className="text-xs bg-[yellow] text-[black] flex px-2 py-1 rounded justify-center align-center cursor-pointer">{t("pointExchange")}</p>
            </div>
          )}
          {record.type == "rollingExchange" && (
            <div className="flex flex-column gap-1">
              <p className="text-xs bg-[green] text-white flex px-2 py-1 rounded justify-center align-center cursor-pointer">{t("rollingExchange")}</p>
            </div>
          )}
          {record.type == "pointDeposit" && (
            <div className="flex flex-column gap-1">
              <p className="text-xs bg-[blue] text-white flex px-2 py-1 rounded justify-center align-center cursor-pointer">{t("pointDeposit")}</p>
            </div>
          )}
        </>
      ),
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
      title: t("updatedAt"),
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (v) =>
        isValidDate(v)
          ? dayjs(v).format("M/D/YYYY HH:mm:ss")
          : "",
    },
    {
      title: t("status"),
      dataIndex: "status",
      key: "status",
      fixed: "right",
      render: (_, record) => {
        return <>
          {record.status == "pending" && <Button
            title={t("pending")}
            variant="outlined"
            onClick={() => onApproveTransaction(record)}
            color="blue"
          >
            {t("pending")}
          </Button>}
          {record.status == "A" ? <button className="text-xs bg-[#1677ff] text-white px-2 py-1 rounded">{t("approve")}</button> : null}
          {record.status == "B" ? <button className="text-xs bg-[#000] text-white px-2 py-1 rounded">Blocked</button> : null}
          {record.status == "C" ? <button className="text-xs bg-[#000] text-white px-2 py-1 rounded">Canceled</button> : null}
          {record.status == "W" ? <button className="text-xs bg-[orange] text-white px-2 py-1 rounded">Waiting</button> : null}
        </>
      }
    },
    {
      title: t("action"),
      key: "action",
      fixed: "right",
      render: (_, record) => (
        <Space.Compact size="small" className="gap-1">
          {(record.status == "pending" || record.status == "W") && <>
            <Button
                title={t("approve")}
                variant="outlined"
                onClick={() => onApproveTransaction(record)}
                color="blue"
              >
                {t("approve")}
              </Button>
                <Button
                title={t("cancel")}
                variant="outlined"
                onClick={() => onCancelTransaction(record)}
                color="red"
              >
                {t("cancel")}
              </Button>
              {
                record.status != "W" && (
                  <Button
                    title={t("waiting")}
                    variant="outlined"
                    onClick={() => onWaitingTransaction(record)}
                    color="orange"
                  >
                    {t("waiting")}
                  </Button>
                )
              }
            </>}
        </Space.Compact>
      ),
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

  const onLevelChange = (v: string = "") => {
    updateFilter(`profiles.level`, v, "eq");
  };

  const onResetCoupon = async () => {
    const confirmed = await modal.confirm({
      title: "Do you want to reset the number of coupons for all members to 0?",
    });
    console.log("Confirmed: ", confirmed);
  };
  const [colorOption, setColorOptoin] = useState<any>("new");
  const onChangeColors = async () => {
    setColorModal(false);
  };
  const onRangerChange = (
    dates: (Dayjs | null)[] | null,
    dateStrings: string[]
  ) => {
    setRange(dateStrings);
    let filters: any[] = tableOptions?.filters ?? [];
    
    // Remove any existing date filters by finding and removing the date OR condition
    filters = filters.filter((f) => {
      if (f.and) {
        // Remove date OR conditions from AND groups
        f.and = f.and.filter((andItem: any) => {
          if (andItem.or) {
            // Check if this OR group contains date fields
            const hasDateFields = andItem.or.some((orItem: any) => 
              orItem.field === "transactions.created_at"
            );
            return !hasDateFields;
          }
          return true;
        });
        return f.and.length > 0; // Keep the AND group only if it has remaining conditions
      }
      return true;
    });
    
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

      // Add the date condition to the first AND group
      if (filters.length > 0 && filters[0].and) {
        filters[0].and.push(dateOrCondition);
      } else {
        // Create a new AND group with the date condition
        filters = [
          {
            and: [
              ...(filters.length > 0 ? filters[0].and || [] : []),
              dateOrCondition
            ]
          }
        ];
      }
    }
    
    setTableOptions({ ...tableOptions, filters });
    refetch({ options: { filters } });
  };

  const onSearch = (value: string) => {
    let filters: any[] = tableOptions?.filters ?? [];

    // Remove any existing search filters by finding and removing the search OR condition
    filters = filters.filter((f) => {
      if (f.and) {
        // Remove search OR conditions from AND groups
        f.and = f.and.filter((andItem: any) => {
          if (andItem.or) {
            // Check if this OR group contains search fields
            const hasSearchFields = andItem.or.some((orItem: any) => 
              orItem.field === "profiles.nickname" ||
              orItem.field === "profiles.holder_name" ||
              orItem.field === "profiles.phone" ||
              orItem.field === "users.userid" ||
              orItem.field === "profiles.name"
            );
            return !hasSearchFields;
          }
          return true;
        });
        return f.and.length > 0; // Keep the AND group only if it has remaining conditions
      }
      return true;
    });

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
            field: "profiles.holder_name",
            value: value,
            op: searchOp,
          },
          {
            field: "users.userid",
            value: value,
            op: searchOp,
          },
          {
            field: "profiles.name",
            value: value,
            op: searchOp,
          }
        ]
      };

      // Add the search condition to the first AND group
      if (filters.length > 0 && filters[0].and) {
        filters[0].and.push(searchOrCondition);
      } else {
        // Create a new AND group with the search condition
        filters = [
          {
            and: [
              ...(filters.length > 0 ? filters[0].and || [] : []),
              searchOrCondition
            ]
          }
        ];
      }
    }

    setTableOptions({ ...tableOptions, filters });
    refetch({ options: { filters } });
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
        [t("point")]: transaction.type == "point" ? transaction.amount : 0,
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
  return (
    <Layout>
      {contextHolder}
      <Content className="overflow-auto h-[calc(100vh-100px)] dark:bg-black">
        <Card
          title={t("admin/menu/memberdwhistory")}
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
                    label: t("entire"),
                    value: "entire",
                  },
                  {
                    label: t("deposit"),
                    value: "deposit",
                  },
                  {
                    label: t("withdraw"),
                    value: "withdrawal",
                  },
                  {
                    label: t("rollingExchange"),
                    value: "rollingExchange",
                  },
                  {
                    label: t("pointDeposit"),
                    value: "pointDeposit",
                  },
                  {
                    label: t("pending"),
                    value: "pending",
                  },
                  {
                    label: t("canceled"),
                    value: "C",
                  }
                ]}
                defaultValue={"entire"}
                onChange={(e) => onTransactionTypeChange(e.target.value)}
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
                  children: range[0] ? range[0] + " ~ " + range[1] : "",
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
                  children: total,
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
          <Modal
            open={colorModal}
            onCancel={() => setColorModal(false)}
            onOk={onChangeColors}
          >
            <Space direction="vertical" className="gap-2">
              <Radio.Group
                onChange={(e) => setColorOptoin(e.target.value)}
                className="!flex !flex-col gap-2"
                defaultValue={"new"}
              >
                <Radio value={"new"}>New Search Criteria</Radio>
                {colorOption == "new" ? (
                  <Form.Item>
                    <Input />
                  </Form.Item>
                ) : null}
                <Radio value={"list"}>
                  Apply the member list search conditions as is:
                </Radio>
                {colorOption == "list" ? (
                  <Form.Item>
                    <Select />
                  </Form.Item>
                ) : null}
              </Radio.Group>
              <Form.Item label="Change Color">
                <Select />
              </Form.Item>
            </Space>
          </Modal>
        </Card>
      </Content>
    </Layout>
  );
};

export default MemberDWPage;
