"use client";

import { usePageTitle } from "@/hooks/usePageTitle";
import { formatNumber } from "@/lib";
import { Button, Card, Table, TableProps, Tag, Space, Form, InputNumber, Radio, Select, Alert, message, Modal, Input, DatePicker } from "antd";
import { Content } from "antd/es/layout/layout";
import dayjs, { Dayjs } from "dayjs";
import { useTranslations } from "next-intl";
import { useState, useEffect, useRef } from "react";
import type { RadioChangeEvent } from "antd";
import api from "@/api";
import { ReloadOutlined } from "@ant-design/icons";
import { RxLetterCaseToggle } from "react-icons/rx";

export default function DepositRequestPage() {
  usePageTitle("Partner - Deposit Request");
  const t = useTranslations();
  const [amount, setAmount] = useState<number>(0);
  const [rechargeBonus, setRechargeBonus] = useState<string>("");
  const [balance, setBalance] = useState<number>(0);
  const [profile, setProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [timeoutState, setTimeoutState] = useState<boolean>(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const [isPasswordCorrect, setIsPasswordCorrect] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [searchValue, setSearchValue] = useState<string>("");

  const filtersRef = useRef({ dateRange, searchValue });

  useEffect(() => {
    filtersRef.current = { dateRange, searchValue };
  }, [dateRange, searchValue]);

  useEffect(() => {
    api("user/me").then((res) => {
      setProfile(res.data.profile);
      setBalance(res.data.profile?.balance || 0);
      const userid = String(res.data.profile.userId);
      api("transactions/get", { 
        method: "GET",
        params: {
          userid,
          type: "deposit"
        }
      }).then((res) => {
        setTransactions(res.data);
        setBalance(res.balance || res.data.profile?.balance || 0);
        setTimeout(() => {
          setTimeoutState(!timeoutState);
        }, 6000);
      });
    }).catch((err) => {
      console.log(err);
    });
  }, [timeoutState]);

  const onAmountChange = (e: RadioChangeEvent) => {
    if (e.target.value == "max") {
      setAmount(234353);
      form.setFieldsValue({ amount: 234353 });
    } else {
      const value = Number(e.target.value) || 0;
      setAmount(value);
      form.setFieldsValue({ amount: value });
    }
  };

  const handleApplication = () => {
    setModalOpen(true);
    setAmount(0);
    setRechargeBonus("");
    form.resetFields();
  };

  const handleModalCancel = () => {
    setModalOpen(false);
    setAmount(0);
    setRechargeBonus("");
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const submitAmount = values.amount;
      const submitRechargeBonus = values.rechargeBonus;

      if (submitAmount <= 0) {
        message.error(t("depositAmountError"));
        return;
      }
      if (!submitRechargeBonus || submitRechargeBonus === "") {
        message.error(t("rechargeBonusError"));
        return;
      }

      setSubmitting(true);
      const userid = Number(profile.userId);
      api("transactions/create", {
        method: "POST",
        data: {
          userId: userid,
          amount: submitAmount,
          type: "deposit",
          explation: submitRechargeBonus
        }
      })
      .then((res) => {
        if (res.data?.status) {
          message.success(t("depositSuccess"));
          setModalOpen(false);
          setAmount(0);
          setRechargeBonus("");
          form.resetFields();
          setTimeoutState(!timeoutState);
          api("user/me").then((res) => {
            setProfile(res.data.profile);
            setBalance(res.data.profile?.balance || 0);
          });
        } else {
          message.error(t("depositFailed"));
        }
      })
      .catch((err) => {
        console.log(err);
        message.error(t("depositFailed"));
      })
      .finally(() => {
        setSubmitting(false);
      });
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  const handleRefresh = () => {
    setTimeoutState(!timeoutState);
  };

  const getCurrentDateTime = () => {
    return dayjs().format("YYYY-MM-DD HH:mm:ss");
  };

  const onRangerChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setDateRange(dates);
    setCurrentPage(1);
  };
  
  const onSearch = (value: string) => {
    setSearchValue(value);
    setCurrentPage(1);
  };

  const rechargeOptions = [
    {
      value: "Domestic/European/Minigame 10% test",
      label: "Domestic/European/Minigame 10% test"
    },
    {
      value: "European/Minigame 5% test",
      label: "European/Minigame 5% test"
    },
    {
      value: "Unpaid",
      label: "Unpaid"
    }
  ];

  const showAccountModal = () => {
    setIsAccountModalOpen(true);
  };

  const handleAccountModalCancel = () => {
    setIsAccountModalOpen(false);
  };

  const handleAccountInquiry = () => {
    api("user/checkPassword", {
      method: "POST",
      data: {
        userid: profile.userId,
        password: password
      }
    }).then((res) => {
      if (res.message == "correct") {
        setIsPasswordCorrect(true);
        handleAccountModalCancel(); 
      } else {
        setIsPasswordCorrect(false);
        setPassword("");
      }
    });
  }

  // Filter transactions based on date range and search
  const filteredTransactions = transactions.filter((transaction) => {
    if (dateRange && dateRange[0] && dateRange[1]) {
      const transactionDate = dayjs(transaction.transactionAt);
      if (transactionDate.isBefore(dateRange[0]) || transactionDate.isAfter(dateRange[1])) {
        return false;
      }
    }
    if (searchValue) {
      const searchLower = searchValue.toLowerCase();
      return (
        String(transaction.id).toLowerCase().includes(searchLower) ||
        String(transaction.amount).toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const columns: TableProps<any>["columns"] = [
    {
      title: t("number"),
      dataIndex: "id", 
      key: "id",
      width: 80,
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1
    },
    {
      title: t("depositAmount"),
      dataIndex: "amount",
      key: "amount",
      render: (value) => formatNumber(value || 0),
    },
    {
      title: t("applicationDate"),
      dataIndex: "transactionAt", 
      key: "transactionAt",
      render: (_, record) => {
        return dayjs(record.transactionAt).format("YYYY-MM-DD HH:mm:ss");
      }
    },
    {
      title: t("situation"),
      dataIndex: "status",
      key: "status",
      render: (_, record) => {
        let color = "default";
        let text = record.status;
        
        if (record.status === "pending" || record.status === "W") {
          color = "yellow";
          text = "Pending";
        } else if (record.status === "A") {
          color = "green";
          text = "Approved";
        } else if (record.status === "C") {
          color = "orange";
          text = "Cancelled";
        } else if (record.status === "DL" || record.status === "deleted") {
          color = "red";
          text = "Deleted";
        }
        
        return <Tag color={color}>{text}</Tag>;
      }
    }
  ];

  return (
    <Content className="overflow-auto h-[calc(100vh-100px)] dark:bg-black">
      <Card 
        title={
          <div className="flex justify-between items-center">
            <p className="text-[15px] font-bold">{t("depoistRequest") || "Deposit Request"}</p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{getCurrentDateTime()}</span>
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
          body: "!p-4",
        }}
      >
        {/* Summary Section */}
        <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200 flex justify-between items-center">
          <div className="flex gap-8">
            <div>
              <span className="text-gray-600">{t("profile/balance") || "Balance"}: </span>
              <span className="font-bold text-lg">{formatNumber(balance)} {t("won") || "won"}</span>
            </div>
          </div>
          <Button 
            type="primary" 
            onClick={handleApplication}
            className="bg-blue-500"
          >
            {t("application") || "Application"}
          </Button>
        </div>

        {/* Filter Section */}
        <Space className="p-2 !w-full mb-4" direction="vertical">
          <Space wrap className="!w-full justify-between">
            <Space>
              <DatePicker.RangePicker
                size="small"
                value={dateRange}
                onChange={onRangerChange}
                showTime
                format="YYYY-MM-DD HH:mm"
              />
              <Space.Compact>
                <Input.Search
                  size="small"
                  placeholder={t("idNicknameAccount") || "ID/Nickname/Account"}
                  value={searchValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchValue(value);
                    if (!value) {
                      onSearch("");
                    }
                  }}
                  enterButton={t("search")}
                  onSearch={onSearch}
                  allowClear
                  style={{ width: 300 }}
                />
                <Button
                  size="small"
                  type="default"
                  icon={<RxLetterCaseToggle />}
                />
              </Space.Compact>
            </Space>
            <Select
              size="small"
              value={pageSize}
              onChange={(value) => {
                setPageSize(value);
                setCurrentPage(1);
              }}
              options={[
                { label: "10 outputs", value: 10 },
                { label: "20 outputs", value: 20 },
                { label: "50 outputs", value: 50 },
                { label: "100 outputs", value: 100 },
              ]}
              style={{ width: 120 }}
            />
          </Space>
        </Space>
        
        {/* Table */}
        <Table 
          dataSource={paginatedTransactions} 
          columns={columns} 
          rowKey="id" 
          size="small" 
          loading={false}
          scroll={{ x: "max-content" }} 
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: filteredTransactions.length,
            showTotal: (total, range) => 
              t("paginationLabel", {
                from: range[0],
                to: range[1],
                total: total,
              }),
            showSizeChanger: false,
            onChange: (page, size) => {
              setCurrentPage(page);
              if (size) {
                setPageSize(size);
              }
            },
          }} 
        />

        {/* Deposit Application Modal */}
        <Modal
          title={t("deposit") || "Deposit Request"}
          open={modalOpen}
          onCancel={handleModalCancel}
          footer={null}
          width={600}
        >
          <Alert
            description={
              <div>
                <p>* {t("depositUnderName")}</p>
                <p>* {t("depositDelay")}</p>
                <p>* <button 
                  className="text-blue-500 cursor-pointer px-2 btn-modal-effect"
                  onClick={showAccountModal}
                >
                  {t("accountInquiry")}
                </button> {t("depositCheck")}</p>
              </div>
            }
            type="info"
            style={{ marginBottom: 16 }}
          />

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item label={t("profile/balance") || "Balance"}>
              <div style={{ fontSize: 16, fontWeight: 'bold', color: '#ff4d4f' }}>
                {formatNumber(balance)}
              </div>
            </Form.Item>

            <Form.Item
              name="amount"
              label={t("billing/depositAmount") || "Deposit Amount"}
              rules={[
                { required: true, message: t("depositAmountError") || "Please enter deposit amount" }
              ]}
            >
              <Space.Compact style={{ width: '100%' }}>
                <InputNumber
                  value={amount}
                  onChange={(value) => {
                    setAmount(value || 0);
                    form.setFieldsValue({ amount: value || 0 });
                  }}
                  style={{ width: '100%' }}
                  min={0}
                />
                <Button onClick={() => {
                  setAmount(0);
                  form.setFieldsValue({ amount: 0 });
                }}>
                  {t("reset") || "Reset"}
                </Button>
              </Space.Compact>
            </Form.Item>

            <Form.Item label={null}>
              <Radio.Group
                value={amount}
                buttonStyle="solid"
                onChange={onAmountChange}
                style={{ width: '100%' }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space wrap>
                    <Radio.Button value={5000}>{formatNumber(5000)}</Radio.Button>
                    <Radio.Button value={10000}>{formatNumber(10000)}</Radio.Button>
                    <Radio.Button value={50000}>{formatNumber(50000)}</Radio.Button>
                    <Radio.Button value={100000}>{formatNumber(100000)}</Radio.Button>
                    <Radio.Button value={500000}>{formatNumber(500000)}</Radio.Button>
                  </Space>
                </Space>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              name="rechargeBonus"
              label={t("billing/rechargeBonus") || "Recharge Bonus"}
              rules={[
                { required: true, message: t("rechargeBonusError") || "Please select recharge bonus" }
              ]}
            >
              <Select
                options={rechargeOptions}
                onChange={(e) => {
                  setRechargeBonus(e);
                  form.setFieldsValue({ rechargeBonus: e });
                }}
                placeholder={t("billing/rechargeBonus")}
              />
            </Form.Item>

            <Form.Item>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={handleModalCancel}>
                  {t("cancel") || "Cancel"}
                </Button>
                <Button type="primary" htmlType="submit" loading={submitting}>
                  {t("billing/applyDeposit") || "Apply Deposit"}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Account Inquiry Modal */}
        <Modal
          title={t("accountInquiry")}
          open={isAccountModalOpen}
          onCancel={handleAccountModalCancel}
          width={600}
          okText={t("confirm")}
          cancelText={t("cancel")}
          className="border-none"
          onOk={handleAccountInquiry}
        >
          <div className="space-y-4">
            <Input.Password 
              className={`${isPasswordCorrect ? "border-green-500" : "border-red-500"}`} 
              placeholder={t("enterYourPassword")} 
              onChange={(e) => setPassword(e.target.value)} 
            /> 
          </div>
          {
            !isPasswordCorrect && <Alert message={t("passwordIncorrect")} type="error" className="mt-4" />
          }
        </Modal>
      </Card>
    </Content>
  );
}
