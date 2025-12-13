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
  Divider,
  Descriptions,
  Alert,
  Modal,
  Form,
  Select,
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
import { usePageTitle } from "@/hooks/usePageTitle";

const MemberTransferPage: React.FC = () => {
  usePageTitle("Admin - Member Transfer History Page");
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

  const [total, setTotal] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const { loading, data, refetch } = useQuery(FILTER_TRANSACTIONS);
  const [colorModal, setColorModal] = useState<boolean>(false);
  const [colorOption, setColorOptoin] = useState<any>("new");
  const [range, setRange] = useState<any[]>([]);
  const [caseSensitive, setCaseSensitive] = useState<boolean>(false);

  const popupWindow = (id: number) => { 
    window.open(`/admin/popup/user?id=${id}`, '_blank', 'width=screen.width,height=screen.height,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no');
  }

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
        return <div className="flex items-center">
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
      dataIndex: "explation",
      key: "explation",
      render: (_, record) => {
        return (
          <div>
            {record.type === "deposit" && (
              <span>Deposit</span>
            )}
            {record.type === "withdrawal" && (
              <span>Withdrawal</span>
            )}
            {record.type === "transfer" && (
              <span>Transfer</span>
            )}
            {record.type === "bettingSettlement" && (
              <span>Betting Settlement</span>
            )}
            {record.type === "betting/placingBet" && (
              <span>Betting Placement</span>
            )}
            {record.type === "DepositCasino" && (
              <span>Deposit Casino</span>
            )}
            {record.type === "WithdrawalCasino" && (
              <span>Withdrawal Casino</span>
            )}
            {record.type === "directDeposit" && (
              <span>Direct Deposit</span>
            )}
            {record.type === "directWithdraw" && (
              <span>Direct Withdrawal</span>
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

  const onLevelChange = (v: string = "") => {
    updateFilter(`profiles.level`, v, "eq");
  };

  const onChangeColors = async () => {
    setColorModal(false);
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
          title={t("admin/menu/memberTransferHistory")}
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
                <Button size="small" type="primary">
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
                    {t("admin/description/distributorMoney")}
                  </span>{" "}
                  {t("admin/description/distributorMoneyDesc")}
                  {t("admin/description/distributorMoneyDesc2")}
                  <span className="text-red-600">
                    {t("admin/description/subordinateMoney")}
                  </span>{" "}{t("admin/description/subordinateMoneyDesc")}
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

export default MemberTransferPage;
