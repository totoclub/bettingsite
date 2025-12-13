"use client";
import React, { useEffect, useState } from "react";

import {
  Layout,
  Space,
  Card,
  Table,
  Tag,
  Button,
  Popconfirm,
  Input,
  DatePicker,
  Radio,
  Select,
  Modal,
  Form,
  message,
} from "antd";
import { FilterDropdown } from "@refinedev/antd";
import type { TableProps } from "antd";
import { Content } from "antd/es/layout/layout";
import { useFormatter, useTranslations } from "next-intl";
import { useMutation, useQuery } from "@apollo/client";
import {
  APPROVE_USER,
  BLOCK_USER,
  FILTER_USERS,
  UPDATE_USER,
} from "@/actions/user";
import { BiBlock, BiTrash } from "react-icons/bi";
import { PiUserCircleCheckLight } from "react-icons/pi";
import { RxLetterCaseToggle } from "react-icons/rx";
import dayjs, { Dayjs } from "dayjs";
import { parseTableOptions, formatNumber } from "@/lib";
import { USER_STATUS, USER_TYPE } from "@/constants";
import { UPDATE_PROFILE } from "@/actions/profile";
import api from "@/api";
import { usePageTitle } from "@/hooks/usePageTitle";

const UserPage: React.FC = () => {
  usePageTitle("Admin - User Management Page");
  const t = useTranslations();
  const f = useFormatter();
  const [tableOptions, setTableOptions] = useState<any>(null);

  const [modal, contextHolder] = Modal.useModal();
  const [total, setTotal] = useState<number>(0);
  const [users, setUsers] = useState<any[]>([]);
  const { loading, data, refetch } = useQuery(FILTER_USERS);
  const [updateProfile] = useMutation(UPDATE_PROFILE);
  const [colorModal, setColorModal] = useState<boolean>(false);
  const [caseSensitive, setCaseSensitive] = useState<boolean>(false);
  const [updateUser] = useMutation(UPDATE_USER);
  const [approveUser] = useMutation(APPROVE_USER);
  const [blockUser] = useMutation(BLOCK_USER);

  const popupWindow = (id: number) => {
    window.open(`/admin/popup/user?id=${id}`, '_blank', 'width=screen.width,height=screen.height,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no');
  }

  const onBlockUser = (user: User) => {
    blockUser({ variables: { id: user.id } })
      .then((res) => {
        if (res.data?.success) {
        }
        refetch(tableOptions);
      })
      .catch((err) => {
        console.log({ err });
      });
  };

  const onApproveUser = (user: User) => {
    approveUser({ variables: { id: user.id } })
      .then((res) => {
        console.log({ res });
        if (res.data?.success) {
        }
        refetch();
      })
      .catch((err) => {
        console.log({ err });
      });
  };
  
  const onUserLevelChange = (u: User, v: string = "") => {
    // updateProfile({
    //   variables: {
    //     id: u.id,
    //     input: {
    //       level: v ? parseInt(v) : 0,
    //     },
    //   },
    // }).then(() => {
    //   refetch(tableOptions);
    // });
  };

  const onUserTypeChange = (u: User, v: string = "") => {
    updateUser({
      variables: {
        id: u.id,
        input: {
          type: v,
        },
      },
    }).then(() => {
      refetch(tableOptions);
    });
  };

  const onUserRoleChange = (u: User, v: string = "USER") => {
    updateUser({
      variables: {
        id: u.id,
        input: {
          role: v,
        },
      },
    }).then(() => {
      refetch(tableOptions);
    });
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

  const userTypeOption = [
    {
      label: "General",
      value: "G",
    },
    {
      label: "Test",
      value: "T",
    },
    {
      label: "Interest",
      value: "I",
    },
    {
      label: "Working",
      value: "W",
    },
  ];
  const roleOption = [
    {
      label: "Admin",
      value: "A",
    },
    {
      label: "Partner",
      value: "P",
    },
    {
      label: "User",
      value: "U",
    },
  ];
  const columns: TableProps<User>["columns"] = [
    {
      title: t("id"),
      dataIndex: "id",
      key: "id",
      fixed: "left",
      render: (_, record, index) => {
        return index + 1;
      },
    },
    {
      title: t("userid"),
      dataIndex: ["user", "userid"],
      key: 'users.userid',
      fixed: "left",
      sorter: {
        compare: (a, b) => {
          return a.userid > b.userid ? -1 : 1;
        },
        multiple: 1,
      },
      render(_, record) {
        return <div className="flex items-center cursor-pointer" onClick={() => popupWindow(record.id)}>
          <p className="w-[15px] h-[15px] flex items-center justify-center rounded-full bg-[#1677ff] text-white text-xs">{record.profile?.level}</p>
          <p className="text-xs text-[white] bg-[#000] px-1 py-0.5 rounded">{record.userid}</p>
        </div>
      },
    },
    {
      title: t("site"),
      dataIndex: "site",
      key: "site",
      render: (text) => text ?? "site",
    },
    {
      title: t("root_dist"),
      dataIndex: "root.userid",
      key: "root.userid",
      render(_, record) {
        return record.root?.userid ? <div className="flex items-center cursor-pointer" onClick={() => popupWindow(record.root?.id)}>
          <p className="text-xs text-[white] bg-[#000] px-1 py-0.5 rounded">{record.root?.userid}</p>
        </div> : "";
      },
    },
    {
      title: t("top_dist"),
      dataIndex: "top_dist",
      key: "top_dist",
      render(_, record) {
        return record.parent?.userid ? <div className="flex items-center cursor-pointer" onClick={() => popupWindow(record.parent?.id)}>
          <p className="text-xs text-[white] bg-[#000] px-1 py-0.5 rounded">{record.parent?.userid}</p>
        </div> : "";
      },
    },
    {
      title: t("nickname"),
      dataIndex: "profile.nickname",
      key: '"Profile"."nickname"',
      render: (_, { profile }) => profile.nickname,
    },
    {
      title: t("holderName"),
      dataIndex: "profile.holderName",
      key: '"Profile"."holder_name"',
      render: (_, { profile }) => profile.holderName,
    },
    {
      title: t("phone"),
      dataIndex: "profile.phone",
      key: '"Profile"."phone"',
      render: (_, { profile }) => profile.phone,
    },
    {
      title: t("birthday"),
      dataIndex: "profile.birthday",
      key: "birthday",
      render: (_, { profile }) =>
        f.dateTime(new Date(profile.birthday) ?? null),
    },
    {
      title: t("level"),
      dataIndex: "profile.level",
      key: "level",
      render: (_, record) => (
        <Select
          size="small"
          placeholder="By Level"
          className="min-w-28"
          defaultValue={`${record.profile.level}`}
          allowClear
          onClear={() => onUserLevelChange(record, "")}
          labelRender={(props) => labelRenderer(props)}
          options={levelOption}
          onChange={(e) => onUserLevelChange(record, e)}
        />
      ),
    },
    {
      title: t("type"),
      dataIndex: "type",
      key: "type",
      render: (_, record) => (
        <Select
          size="small"
          placeholder="By Level"
          className="min-w-28"
          defaultValue={`${record.type}`}
          allowClear
          options={userTypeOption}
          onClear={() => onUserTypeChange(record, "")}
          labelRender={(props) => USER_TYPE[props.value]}
          onChange={(e) => onUserTypeChange(record, e)}
        />
      ),
    },
    {
      title: t("status"),
      dataIndex: "status",
      key: "status",
      render: (text, record) => {
        if (record.status == "P") {
          return (
            <Popconfirm
              title={t("confirmSure")}
              onConfirm={
                record.status
                  ? () => onBlockUser(record)
                  : () => onApproveUser(record)
              }
              description={t("approveMessage")}
            >
              <Tag color="warning" className="mr-2">
                {USER_STATUS[text]}
              </Tag>
            </Popconfirm>
          );
        }
        return (
          <Tag color={text == "A" ? "success" : "gold"}>
            {USER_STATUS[text]}
          </Tag>
        );
      },
    },
    {
      title: t("balance"),
      dataIndex: "balance",
      key: "balance",
      render: (_, { profile }) => formatNumber(profile?.balance || 0),
    },
    {
      title: t("point"),
      dataIndex: "point",
      key: "point",
      render: (_, { profile }) => formatNumber(profile?.point || 0),
    },
    {
      title: t("comp"),
      dataIndex: "comp",
      key: "comp",
      render: (_, { profile }) => profile.comp,
    },
    {
      title: t("usdtAddress"),
      dataIndex: "usdtAddress",
      key: "usdtAddress",
    },
    {
      title: t("currentIP"),
      dataIndex: "currentIP",
      key: "currentIP",
    },
    {
      title: "IP",
      dataIndex: "IP",
      key: "IP",
    },
    {
      title: t("coupon"),
      dataIndex: "profile.coupon",
      key: "profile.coupon",
      render: (_, { profile }) => profile.coupon,
    },
    // {
    //   title: t("lastDeposit"),
    //   dataIndex: "profile.lastDeposit",
    //   key: "lastDeposit",
    //   render: (_, { profile }) =>
    //     profile.lastDeposit ? f.dateTime(new Date(profile.lastDeposit)) : null,
    // },
    // {
    //   title: t("lastWithdraw"),
    //   dataIndex: "profile.lastWithdraw",
    //   key: "lastWithdraw",
    //   render: (_, { profile }) =>
    //     profile.lastWithdraw
    //       ? f.dateTime(new Date(profile.lastWithdraw))
    //       : null,
    // },
    {
      title: t("role"),
      key: "role",
      dataIndex: "role",
      render: (role, record) => (
        <Select
          size="small"
          placeholder="By Level"
          className="min-w-28"
          defaultValue={`${role}`}
          labelRender={(props) => USER_TYPE[props.value]}
          options={roleOption}
          onChange={(e) => onUserRoleChange(record, e)}
        />
      ),
    },
    {
      title: t("lastLogin"),
      dataIndex: "updatedAt",
      key: "updatedAt",
      sorter: {
        compare: (a, b) => {
          return new Date(a.updatedAt) > new Date(b.updatedAt) ? -1 : 1;
        },
        multiple: 2,
      },
      render: (text) => f.dateTime(new Date(text) ?? null),
      // defaultFilteredValue: getDefaultFilter("updatedAt"),
      filterDropdown: (props) => (
        <FilterDropdown
          {...props}
          mapValue={(selectedKeys, event) => {
            if (event === "value") {
              return selectedKeys?.map((key) => {
                if (typeof key === "string") {
                  return dayjs(key);
                }

                return key;
              });
            }

            if (event === "onChange") {
              if (selectedKeys.every(dayjs.isDayjs)) {
                return selectedKeys?.map((date: any) =>
                  dayjs(date).toISOString()
                );
              }
            }

            return selectedKeys;
          }}
        >
          <DatePicker.RangePicker />
        </FilterDropdown>
      ),
    },
    {
      title: t("createdAt"),
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => (text ? f.dateTime(new Date(text) ?? null) : ""),
    },
    {
      title: t("action"),
      key: "action",
      fixed: "right",
      render: (_, record) => (
        <Space.Compact size="small" className="gap-2">
          <Popconfirm
            title={t("confirmSure")}
            onConfirm={
              record.status
                ? () => onBlockUser(record)
                : () => onApproveUser(record)
            }
            description={
              record.status ? t("blockMessage") : t("approveMessage")
            }
          >
            {record.status ? (
              <button className="bg-black border-1 text-white rounded px-2 cursor-pointer">
                {t("block")}
              </button>
            ) : (
              <button className="bg-[green] border-1 text-white rounded px-2 cursor-pointer">
                {t("approve")}
              </button>
            )}
          </Popconfirm>
          <button className="bg-[red] border-1 text-white rounded px-2 cursor-pointer">
            {t("delete")}
          </button>
        </Space.Compact>
      ),
    },
  ];

  const onChange: TableProps<User>["onChange"] = (
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

  const onBlackMemoChange = (v: string) => {
    updateFilter("black_memo", v, "eq");
  };

  const onReferralChange = (v: string) => {
    updateFilter(
      '"Profile"."referral"',
      v,
      v == "not_null" ? "is_not_null" : "is_null"
    );
  };

  const onMemberTypeChange = (v: string) => {
    updateFilter("type", v, "eq");
  };

  const onMemberStatusChange = (v: string) => {
    updateFilter("status", v, "eq");
  };

  const onLevelChange = (v: string = "") => {
    updateFilter(`"Profile"."level"`, v, "eq");
  };

  const onRoleChange = (v: string = "") => {
    updateFilter(`users.role`, v, "eq");
  };

  const onResetCoupon = async () => {
    modal.confirm({
      title: "Do you want to reset the number of coupons for all members to 0?",
      onOk: async () => {
        try {
          const response = await api("admin/users/reset-coupons", {
            method: "POST",
          });
          
          if (response.success) {
            message.success(response.message || "All coupons have been reset to 0");
            // Refresh the user list
            refetch(tableOptions);
          } else {
            message.error("Failed to reset coupons");
          }
        } catch (error: any) {
          console.error("Error resetting coupons:", error);
          message.error(error?.response?.data?.message || "Failed to reset coupons");
        }
      },
    });
  };
  const [colorOption, setColorOptoin] = useState<any>("new");
  const onChangeColors = async () => {
    setColorModal(false);
  };
  const onRangerChange = (
    dates: (Dayjs | null)[] | null,
    dateStrings: string[]
  ) => {
    let filters: { field: string; value: string; op: string }[] =
      tableOptions?.filters ?? [];
    const f = filters.filter((f) => f.field !== "users.created_at");
    if (dates?.at(0)) {
      filters = [
        ...f,
        {
          field: "users.created_at",
          value: dateStrings[0],
          op: "gt",
        },
        {
          field: "users.created_at",
          value: dateStrings[1],
          op: "lt",
        },
      ];
    }
    setTableOptions({ ...tableOptions, filters });
  };

  const onSearch = (value: string) => {
    let filters: { field: string; value: string; op: string }[] =
      tableOptions?.filters ?? [];

    // Remove any existing search filters
    filters = filters.filter((f) => 
      f.field !== '"Profile"."nickname"' &&
      f.field !== '"Profile"."holder_name"' &&
      f.field !== '"Profile"."phone"' &&
      f.field !== "users.userid" &&
      f.field !== '"Profile"."name"'
    );

    if (value) {
      // Determine the search operator based on case sensitivity
      const searchOp = caseSensitive ? "like" : "ilike";
      
      // Add search filters for multiple fields
      filters = [
        ...filters,
        {
          field: '"Profile"."nickname"',
          value: value,
          op: searchOp,
        },
        {
          field: '"Profile"."phone"',
          value: value,
          op: searchOp,
        },
        {
          field: '"Profile"."holder_name"',
          value: value,
          op: searchOp,
        },
        {
          field: "users.userid",
          value: value,
          op: searchOp,
        },
        {
          field: '"Profile"."name"',
          value: value,
          op: searchOp,
        }
      ];
    }

    setTableOptions({ ...tableOptions, filters });
  };

  useEffect(() => {
    setUsers(
      data?.response?.users?.map((u: any) => {
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
          title={t("admin/users")}
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
                    label: t("user"),
                    value: "U",
                  },
                  {
                    label: t("distributor"),
                    value: "P",
                  },
                  {
                    label: t("admin"),
                    value: "A",
                  },
                ]}
                defaultValue={""}
                onChange={(e) => onRoleChange(e.target.value)}
              />
              {/* <Radio.Group
                size="small"
                optionType="button"
                buttonStyle="solid"
                options={[
                  {
                    label: t("all"),
                    value: "",
                  },
                  {
                    label: t("referral") + " O",
                    value: "not_null",
                  },
                  {
                    label: t("referral") + " X",
                    value: "null",
                  },
                ]}
                defaultValue={""}
                onChange={(e) => onReferralChange(e.target.value)}
              /> */}
              {/* <Radio.Group
                size="small"
                optionType="button"
                buttonStyle="solid"
                options={[
                  {
                    label: t("all"),
                    value: "",
                  },
                  {
                    label: t("blackMemo") + " O",
                    value: "true",
                  },
                  {
                    label: t("blackMemo") + " X",
                    value: "false",
                  },
                ]}
                defaultValue={""}
                onChange={(e) => onBlackMemoChange(e.target.value)}
              /> */}

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
                    label: t("general"),
                    value: "G",
                  },
                  {
                    label: t("test"),
                    value: "T",
                  },
                  {
                    label: t("interest"),
                    value: "I",
                  },
                  {
                    label: t("working"),
                    value: "W",
                  },
                ]}
                defaultValue={""}
                onChange={(e) => onMemberTypeChange(e.target.value)}
              />
              <Radio.Group
                className="flex-nowrap"
                size="small"
                optionType="button"
                buttonStyle="solid"
                options={[
                  {
                    label: t("all"),
                    value: "",
                  },
                  {
                    label: t("approved"),
                    value: "A",
                  },
                  {
                    label: t("suspened"),
                    value: "S",
                  },
                  {
                    label: t("deleted"),
                    value: "D",
                  },
                  {
                    label: t("blocked"),
                    value: "B",
                  },
                  {
                    label: t("inactive"),
                    value: "I",
                  },
                ]}
                defaultValue={""}
                onChange={(e) => onMemberStatusChange(e.target.value)}
              />
              {/* <Radio.Group
                size="small"
                optionType="button"
                buttonStyle="solid"
                options={[
                  {
                    label: t("all"),
                    value: "",
                  },
                  {
                    label: t("reg_ip_dup"),
                    value: true,
                  },
                  {
                    label: t("current_ip_dup"),
                    value: false,
                  },
                ]}
                defaultValue={""}
              /> */}
            </Space>
            <Space className="!w-full justify-between">
              <Space>
                {/* <Select
                  size="small"
                  placeholder="select dist"
                  className="min-w-28"
                  allowClear
                />
                <Select
                  size="small"
                  placeholder="By Color"
                  className="min-w-28"
                  allowClear
                /> */}
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
              <Space.Compact className="gap-1">
                <Button size="small" type="primary" onClick={onResetCoupon}>
                  {t("reset_all_coupon")}
                </Button>
              </Space.Compact>
            </Space>
          </Space>
          <Table<User>
            columns={columns}
            loading={loading}
            dataSource={users ?? []}
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

export default UserPage;
