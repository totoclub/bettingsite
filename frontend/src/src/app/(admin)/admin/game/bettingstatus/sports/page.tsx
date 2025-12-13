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
  // BLOCK_TRANSACTION,
  FILTER_TRANSACTIONS,
  CANCEL_TRANSACTION,
  WAITING_TRANSACTION,
} from "@/actions/transaction";
import { RxLetterCaseToggle } from "react-icons/rx";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { isValidDate, parseTableOptions, formatNumber } from "@/lib";

const SportsBettingStatus: React.FC = () => {
  const t = useTranslations();
  const f = useFormatter();
  const [tableOptions, setTableOptions] = useState<any>(null);

  const [modal, contextHolder] = Modal.useModal();
  const [range, setRange] = useState<any[]>([]);

  const [total, setTotal] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const { loading, data, refetch } = useQuery(FILTER_TRANSACTIONS);
  const [colorModal, setColorModal] = useState<boolean>(false);

  const [approveTransaction] = useMutation(APPROVE_TRANSACTION);
  // const [blockTransaction] = useMutation(BLOCK_TRANSACTION);
  const [cancelTransaction] = useMutation(CANCEL_TRANSACTION);
  const [waitingTransaction] = useMutation(WAITING_TRANSACTION);

  useEffect(() => {
    const interval = setInterval(() => {
      refetch(tableOptions ?? undefined);
    }, 60000);
    return () => clearInterval(interval);
  }, []);
  // const onBlockTransaction = (transaction: Transaction) => {
  //   blockTransaction({ variables: { id: transaction.id } })
  //     .then((res) => {
  //       if (res.data?.success) {
  //       }
  //       refetch(tableOptions);
  //     })
  //     .catch((err) => {
  //       console.log({ err });
  //     });
  // };

  const onApproveTransaction = (transaction: Transaction) => {
    approveTransaction({ variables: { id: transaction.id } })
      .then((res) => {
        if (res.data?.success) {
          refetch(tableOptions);  
        }
      })
      .catch((err) => {
        console.error('Error approving transaction:', err);
      });
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
    updateFilter("transactions.type", v, "eq");
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
      title: "Level",
      dataIndex: "level",
      key: "level",
      fixed: "left",
      render: (_, record) => {
        // return (record.user?.profile?.level + " " + record.user?.profile?.name);
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
      title: t("phone"),
      dataIndex: "profile.phone",
      key: '"Profile"."phone"',
      render: (_, record) => record.user?.profile?.phone,
      filterDropdown: (props) => (
        <FilterDropdown {...props}>
          <Input className="w-full" />
        </FilterDropdown>
      ),
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
      render: (_, record) => record.user?.profile?.accountNumber,
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
      render: (_, record) => formatNumber(record.balanceBefore || 0),
    },
    {
      title: t("amount"),
      dataIndex: "amount",
      key: "amount",
      render: (_, record) => formatNumber(record.amount || 0),
    },
    {
      title: t("balanceAfter"),
      dataIndex: "balanceAfter",
      key: "balanceAfter",
      render: (_, record) => formatNumber(record.balanceAfter || 0),
    },
   
    {
      title: t("pointBefore"),
      dataIndex: "pointBefore",
      key: "pointBefore",
      render: (_, record) => formatNumber(record.pointBefore || 0),
    },
    {
      title: t("point"),
      dataIndex: "point",
      key: "point",
      render: () => formatNumber(0),
    },
    {
      title: t("pointAfter"),
      dataIndex: "pointAfter",
      key: "pointAfter",
      render: (_, record) => formatNumber(record.pointAfter || 0),
    },
    {
      title: t("usdtDesc"),
      dataIndex: "usdtDesc",
      key: "usdtDesc",
    },
    {
      title: t("shortcut"),
      dataIndex: "shortcut",
      width: 100,
      key: "shortcut",
      render: (_, record) => (
        <div className="flex flex-column gap-1">
          <p className="text-xs bg-[red] text-white flex px-2 py-1 rounded justify-center align-center cursor-pointer">Money</p>
          <p className="text-xs bg-[#1677ff] text-white flex px-2 py-1 rounded justify-center align-center cursor-pointer">Bet</p>
        </div>
      ),
    },
    {
      title: t("transactionAt"),
      dataIndex: "transactionAt",
      key: "transactionAt",
      render: (v) => (isValidDate(v) ? dayjs(v).format("M/D/YYYY HH:mm:ss") : ""),
    },
    {
      title: t("approvedAt"),
      dataIndex: "profile.approvedAt",
      key: "approvedAt",
      render: (v) => (isValidDate(v) ? dayjs(v).format("M/D/YYYY HH:mm:ss") : ""),
    },
    {
      title: t("createdAt"),
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v) => (isValidDate(v) ? dayjs(v).format("M/D/YYYY HH:mm:ss") : ""),
    },
    {
      title: t("status"),
      dataIndex: "status",
      key: "status",
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

  const onUSDTStatusChange = (v: string) => {
    if (v == "true") {
      updateFilter("usdt_desc", v, "is_not_null");
    } else if (v == "false") {
      updateFilter("usdt_desc", v, "is_null");
    } else {
      updateFilter("usdt_desc", v, "eq");
    }
  };

  const onMemberTypeChange = (v: string) => {
    updateFilter("type", v, "eq");
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
    let filters: { field: string; value: string; op: string }[] =
      tableOptions?.filters ?? [];
    const f = filters.filter((f) => f.field !== "transactions.created_at");
    if (dates?.at(0)) {
      filters = [
        ...f,
        {
          field: "transactions.created_at",
          value: dateStrings[0],
          op: "gt",
        },
        {
          field: "transactions.created_at",
          value: dateStrings[1],
          op: "lt",
        },
      ];
    }
    console.log({ filters });
    setTableOptions({ ...tableOptions, filters });
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
      {contextHolder}
      <Content className="overflow-auto h-[calc(100vh-100px)] dark:bg-black">
        <Card
          title={t("admin/menu/sportsBetAlert")}
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
                    label: t("deposit"),
                    value: "D",
                  },
                  {
                    label: t("withdraw"),
                    value: "W",
                  },
                  {
                    label: t("adminPay"),
                    value: "AP",
                  },
                  {
                    label: t("adminRecovery"),
                    value: "AR",
                  },
                  {
                    label: t("totalRecovery"),
                    value: "TR",
                  },
                  {
                    label: t("subPay"),
                    value: "SP",
                  },
                  {
                    label: t("lowerRecover"),
                    value: "LR",
                  },
                  {
                    label: t("recharge"),
                    value: "R",
                  },
                  {
                    label: t("exchange"),
                    value: "E",
                  },
                  {
                    label: t("canceled"),
                    value: "C",
                  },
                  {
                    label: t("deleted"),
                    value: "DL",
                  },
                ]}
                defaultValue={""}
                onChange={(e) => onTransactionTypeChange(e.target.value)}
              />

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
                    label: t("firstDepositUponSignup"),
                    value: "D",
                  },
                  {
                    label: t("firstChargeEveryday"),
                    value: "C",
                  },
                  {
                    label: t("redeposit"),
                    value: "R",
                  },
                ]}
                defaultValue={""}
                onChange={(e) => onMemberTypeChange(e.target.value)}
              />

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
                    label: "USDT O",
                    value: "true",
                  },
                  {
                    label: "USDT X",
                    value: "false",
                  },
                ]}
                defaultValue={""}
                onChange={(e) => onUSDTStatusChange(e.target.value)}
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
                  placeholder="ID,Nickname,Account Holder,Phone Number"
                  suffix={
                    <Button
                      size="small"
                      type="text"
                      icon={<RxLetterCaseToggle />}
                    />
                  }
                  enterButton={t("search")}
                />
                <Select
                  size="small"
                  placeholder="By Color"
                  className="min-w-28"
                  allowClear
                />
                <Select
                  size="small"
                  placeholder="By Level"
                  className="min-w-28"
                  allowClear
                  onClear={onLevelChange}
                  options={levelOption}
                  labelRender={labelRenderer}
                  onChange={onLevelChange}
                />
              </Space>
              <Space.Compact className="gap-1">
                <Button size="small" type="primary" onClick={onResetCoupon}>
                  {t("download")}
                </Button>
              </Space.Compact>
            </Space>
            <Divider className="!p-0 !m-0" />
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

export default SportsBettingStatus;
