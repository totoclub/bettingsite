"use client";
import React, { useEffect, useState } from "react";

import {
  Layout,
  Space,
  Card,
  Table,
  Button,
  Popconfirm,
  Input,
  Radio,
  Select,
  Modal,
  Form,
  Switch,
  InputNumber,
  message
} from "antd";
import type { RadioChangeEvent, TableProps } from "antd";

import { Content } from "antd/es/layout/layout";
import { useFormatter, useTranslations } from "next-intl";
import { useMutation, useQuery } from "@apollo/client";
import {
  APPROVE_USER,
  BLOCK_USER,
  CREATE_USER,
  GET_DISTRIBUTORS,
  INACTIVATE_USER,
  DELETE_USER,
  UPDATE_USER,
} from "@/actions/user";
import { BiBlock, BiTrash } from "react-icons/bi";
import { PiUserCircleCheckLight } from "react-icons/pi";
import { RxLetterCaseToggle } from "react-icons/rx";
import { buildTree, parseTableOptions, formatNumber } from "@/lib";
import { USER_STATUS } from "@/constants";
import { GiNightSleep } from "react-icons/gi";
import { GET_DOMAINS } from "@/actions/domain";
import { FILTER_BANK } from "@/actions/bank";
import BasicInformation from "@/components/Admin/Distributor/Basic";
import LosingSettingPage from "./pages/losingSetting/page";
import "./index.css";
import RollingCasinoPage from "./pages/rollingCasino/page";
import api from "@/api";

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 8 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 16 },
  },
};

const tailFormItemLayout = {
  wrapperCol: {
    xs: {
      span: 24,
      offset: 0,
    },
    sm: {
      span: 16,
      offset: 8,
    },
  },
};

const PartnerPage: React.FC = () => {
  const t = useTranslations();
  const f = useFormatter();
  const [form] = Form.useForm();
  const [tableOptions, setTableOptions] = useState<any>({
    filters: [
      {
        or: [
          {
            field: "role",
            value: "P",
            op: "eq",
          },
          {
            field: "role",
            value: "A",
            op: "eq",
          },
        ],
      },
      {
        field: "status",
        value: "D",
        op: "neq",
      },
    ],
  });

  const [, contextHolder] = Modal.useModal();
  const [total, setTotal] = useState<number>(0);
  const [users, setUsers] = useState<any[]>([]);
  const [treeUsers, setTreeUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null | undefined>(null);
  const [currentUserChildren, setCurrentUserChildren] = useState<any[]>([]);
  const { loading, data, refetch } = useQuery(GET_DISTRIBUTORS);

  const { data: bankData } = useQuery(FILTER_BANK);
  const { data: childrenData, refetch: refetchChildren } =
    useQuery(GET_DISTRIBUTORS);

  const { data: domainData } = useQuery(GET_DOMAINS);
  const [domains, setDomains] = useState<any[]>([]);

  const [regModal, setRegModal] = useState<boolean>(false);
  const [domainModal, setDomainModal] = useState<boolean>(false);
  const [moneyModal, setMoneyModal] = useState<boolean>(false);
  const [pointsModal, setPointsModal] = useState<boolean>(false);
  const [losingRollingModal, setLosingRollingModal] = useState<boolean>(false);
  const [selectedLosingRollingTab, setSelectedLosingRollingTab] = useState<string>("losingSetting");
  const [caseSensitive, setCaseSensitive] = useState<boolean>(false);
  const [amount, setAmount] = useState<number>(0);
  const [pointAmount, setPointAmount] = useState<number>(0);

  const [createUser] = useMutation(CREATE_USER);
  const [approveUser] = useMutation(APPROVE_USER);
  const [blockUser] = useMutation(BLOCK_USER);
  const [inactivateUser] = useMutation(INACTIVATE_USER);
  const [deleteUser] = useMutation(DELETE_USER);
  const [updateUser] = useMutation(UPDATE_USER);

  const onBlockUser = (user: User) => {
    blockUser({ variables: { id: user.id } })
      .then((res) => {
        if (res.data?.success) {
          message.success(t("userBlockedSuccessfully") || "User blocked successfully");
        }
        refetch(tableOptions);
        window.location.reload()
      })
      .catch((err) => {
        console.log({ err });
        message.error(t("blockFailed") || "Failed to block user");
      });
  };

  const popupWindow = (id: number) => {
    window.open(`/admin/popup/user?id=${id}`, '_blank', 'width=screen.width,height=screen.height,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no');
  }

  const onApproveUser = (user: User) => {
    approveUser({ variables: { id: user.id } })
      .then((res) => {
        if (res.data?.success) {
          message.success(t("userApprovedSuccessfully") || "User approved successfully");
        }
        refetch(tableOptions);
        window.location.reload()
      })
      .catch((err) => {
        console.log({ err });
        message.error(t("approvalFailed") || "Failed to approve user");
      });
  };

  const onInactivateUser = (user: User) => {
    inactivateUser({ 
      variables: { 
        id: user.id,
        input: { status: "I" }
      } 
    })
      .then((res) => {
        if (res.data?.success) {
          message.success(t("userInactivatedSuccessfully") || "User set to dormancy successfully");
        }
        refetch(tableOptions);
        window.location.reload()
      })
      .catch((err) => {
        console.log({ err });
        message.error(t("inactivateFailed") || "Failed to inactivate user");
      });
  };

  const onDeleteUser = (user: User) => {
    deleteUser({ 
      variables: { 
        id: user.id
      } 
    })
      .then((res) => {
        if (res.data?.success) {
          message.success(t("userDeletedSuccessfully") || "User has been permanently deleted from the database");
        }
        // Refetch with current table options to update the list
        refetch(tableOptions);
        window.location.reload()
      })
      .catch((err) => {
        console.error("Delete user error:", err);
        message.error(err?.message || t("deleteFailed") || "Failed to delete user");
      });
  };

  const onDomainRegister = (record: User) => {
    setCurrentUser(record);
    setDomainModal(true);
  };

  const onUpdateDomain = async (v: any) => {
    if (!currentUser?.id) {
      message.error(t("userNotSelected"));
      return;
    }

    try {
      // Get domain IDs from form - they should be numbers from the Select component
      // GraphQL will convert them to the appropriate type
      const domainIds = v.domainId || [];
      
      console.log("Updating domain IDs:", domainIds, "for user:", currentUser.id);
      
      const result = await updateUser({
        variables: {
          id: String(currentUser.id),
          input: {
            domainIds: domainIds.length > 0 ? domainIds.map((id: any) => String(id)) : [],
          },
        },
      });

      console.log("Update result:", result);

      if (result.data?.success) {
        message.success(t("domainUpdatedSuccessfully") || "Domain updated successfully");
        setDomainModal(false);
        refetch(tableOptions);
      } else {
        message.error(t("updateFailed") || "Failed to update domain");
      }
    } catch (error: any) {
      console.error("Update domain error:", error);
      const errorMessage = error?.graphQLErrors?.[0]?.message || error?.message || t("updateFailed") || "Failed to update domain";
      message.error(errorMessage);
    }
  };

  const onRegisterUser = async (v: any) => {
    try {
      console.log("Registering user with data:", v);
      
      // Prepare input data according to NewUser schema
      const input: any = {
        userid: v.userid,
        password: v.password,
        name: v.name,
        type: v.type || "G", // Default to General
        role: v.role || "P", // Default to Partner
        status: "P", // Pending status
        nickname: v.nickname,
        phone: v.phone,
        holderName: v.holderName,
      };

      // Add optional fields if provided
      if (v.domainId) input.domainId = String(v.domainId);
      if (v.bankId) input.bankId = String(v.bankId);
      if (v.settlementId) input.settlementId = String(v.settlementId);
      // Note: accountNumber and secPassword are not in NewUser schema
      // They may need to be handled separately or the backend schema needs to be updated

      const result = await createUser({
        variables: {
          input: input,
        },
      });

      console.log("Create user result:", result);

      if (result.data?.success) {
        message.success(t("userCreatedSuccessfully") || "User created successfully");
        setRegModal(false);
        form.resetFields();
        refetch(tableOptions);
      } else {
        message.error(t("createFailed") || "Failed to create user");
      }
    } catch (error: any) {
      console.error("Create user error:", error);
      const errorMessage = error?.graphQLErrors?.[0]?.message || error?.message || t("createFailed") || "Failed to create user";
      message.error(errorMessage);
    }
  };

  const onPayment = (record: User) => {
    setCurrentUser(record);
    setMoneyModal(true);
  };

  const onPointsManagement = (record: User) => {
    setCurrentUser(record);
    setPointsModal(true);
  };

  const onLosingRollingSetting = (record: User) => {
    setCurrentUser(record);
    setLosingRollingModal(true);
    
    // Fetch child data for the current user
    refetchChildren({
      filters: [
        {
          field: "parent_id",
          value: record.id,
          op: "eq",
        },
      ],
    }).then((result) => {
      // Use the result directly instead of childrenData
      const fetchedChildren = result.data?.response?.users || [];
      setCurrentUserChildren(
        fetchedChildren.map((u: any) => {
          return { ...u, key: u.id };
        })
      );
    }).catch((error) => {
      console.error("Error fetching children for losing/rolling setting:", error);
      message.error(t("failedToLoadChildren") || "Failed to load children");
    });
  };

  const onDeposit = async () => {
    if (!currentUser?.id) {
      message.error(t("userNotSelected"));
      return;
    }

    if (!amount || amount <= 0) {
      message.error(t("invalidAmount"));
      return;
    }

    try {
      const response = await api("admin/transaction/deposit", {
        method: "POST",
        data: {
          userId: currentUser.id,
          amount: amount,
        },
      });

      message.success(t("depositSuccess"));
      setMoneyModal(false);
      setAmount(0);
      form.resetFields();
      
      // Refetch users to update balance
      refetch(tableOptions);
    } catch (error: any) {
      console.error("Deposit error:", error);
      message.error(error?.response?.data?.error || t("depositFailed"));
    }
  };

  const onWithdraw = async () => {
    if (!currentUser?.id) {
      message.error(t("userNotSelected"));
      return;
    }

    if (!amount || amount <= 0) {
      message.error(t("invalidAmount"));
      return;
    }

    if (amount > (currentUser?.profile?.balance ?? 0)) {
      message.error(t("balanceNotEnough"));
      return;
    }

    try {
      const response = await api("admin/transaction/withdrawal", {
        method: "POST",
        data: {
          userId: currentUser.id,
          amount: amount,
        },
      });

      message.success(t("withdrawalSuccess"));
      setMoneyModal(false);
      setAmount(0);
      form.resetFields();
      
      // Refetch users to update balance
      refetch(tableOptions);
    } catch (error: any) {
      console.error("Withdrawal error:", error);
      message.error(error?.response?.data?.error || t("withdrawalFailed"));
    }
  };

  const onAddPoints = async () => {
    if (!currentUser?.id) {
      message.error(t("userNotSelected"));
      return;
    }

    if (!pointAmount || pointAmount <= 0) {
      message.error(t("invalidAmount"));
      return;
    }

    try {
      // TODO: Implement API call for adding points
      console.log("Adding points:", pointAmount, "to user:", currentUser.id);
      message.success(t("pointsAddedSuccessfully") || "Points added successfully");
      setPointsModal(false);
      setPointAmount(0);
      form.resetFields();
      
      // Refetch users to update points
      refetch(tableOptions);
    } catch (error: any) {
      console.error("Add points error:", error);
      message.error(error?.response?.data?.error || t("pointsAddFailed") || "Failed to add points");
    }
  };

  const onSubtractPoints = async () => {
    if (!currentUser?.id) {
      message.error(t("userNotSelected"));
      return;
    }

    if (!pointAmount || pointAmount <= 0) {
      message.error(t("invalidAmount"));
      return;
    }

    if (pointAmount > (currentUser?.profile?.point ?? 0)) {
      message.error(t("notEnoughPoints") || "Not enough points");
      return;
    }

    try {
      // TODO: Implement API call for subtracting points
      console.log("Subtracting points:", pointAmount, "from user:", currentUser.id);
      message.success(t("pointsSubtractedSuccessfully") || "Points subtracted successfully");
      setPointsModal(false);
      setPointAmount(0);
      form.resetFields();
      
      // Refetch users to update points
      refetch(tableOptions);
    } catch (error: any) {
      console.error("Subtract points error:", error);
      message.error(error?.response?.data?.error || t("pointsSubtractFailed") || "Failed to subtract points");
    }
  };

  const onPointAmountChange = (e: RadioChangeEvent) => {
    if (e.target.value == "max") {
      form.setFieldValue("pointAmount", 10000000);
    } else {
      form.setFieldValue("pointAmount", parseInt(e.target.value));
    }
  };

  const onAmountChange = (e: RadioChangeEvent) => {
    if (e.target.value == "max") {
      form.setFieldValue("amount", 10000000);
    } else {
      form.setFieldValue("amount", parseInt(e.target.value));
    }
  };
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

  const onMemberStatusChange = (v: string) => {
    let filters: { field: string; value: string; op: string }[] =
      tableOptions?.filters ?? [];
    
    // Remove existing status filters
    filters = filters.filter((f) => f.field !== "status");
    
    if (v) {
      // If a specific status is selected, filter by that status
      filters = [
        ...filters,
        {
          field: "status",
          value: v,
          op: "eq",
        },
      ];
    } else {
      // If no status is selected, exclude deleted users by default
      filters = [
        ...filters,
        {
          field: "status",
          value: "D",
          op: "neq",
        },
      ];
    }
    
    setTableOptions({ ...tableOptions, filters });
  };

  const onLevelChange = (v: string = "") => {
    updateFilter(`"Profile"."level"`, v, "eq");
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

  const onExpand = (expanded: boolean, record: User) => {
    if (expanded) {
      refetchChildren({
        filters: [
          {
            field: "parent_id",
            value: record.id,
            op: "eq",
          },
        ],
      }).then((result) => {
        // Get children from the refetch result
        const fetchedChildren = result.data?.response?.users || [];
        
        // Get existing user IDs to avoid duplicates
        const existingUserIds = new Set(users.map((u: any) => u.id));
        
        // Map children and ensure they have parentId set and key property
        const newChildren = fetchedChildren
          .filter((u: any) => !existingUserIds.has(u.id)) // Filter out duplicates
          .map((u: any) => ({
            ...u,
            key: u.id,
            parentId: record.id, // Ensure parentId is set correctly
          }));
        
        if (newChildren.length > 0) {
          setUsers([...(users ?? []), ...newChildren]);
        }
      }).catch((error) => {
        console.error("Error fetching children:", error);
        message.error(t("failedToLoadChildren") || "Failed to load children");
      });
    } else {
      // When collapsing, we can optionally remove children to keep the list clean
      // For now, we'll keep them in the list but they won't be displayed if parentId doesn't match
    }
  };

  const columns: TableProps<User>["columns"] = [
    {
      title: t('userid'),
      dataIndex: "userid",
      key: "userid",
      fixed: "left",
      width: 200,
      sorter: {
        compare: (a, b) => {
          return a.userid > b.userid ? -1 : 1;
        },
        multiple: 1,
      },
      render: (text, record) => (
        <div>
          <div className="flex items-center cursor-pointer" onClick={() => popupWindow(record.id)}>
            <p className="w-[15px] h-[15px] min-w-[15px] min-h-[15px] flex items-center justify-center rounded-full bg-[#1677ff] text-white text-xs">{record.profile?.level}</p>
            <p className="text-xs text-[white] bg-[#000] px-1 py-0.5 rounded">{record.userid}</p>
          </div>
        </div>        
      ),
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
      render: (_, record) => {
        return record.root?.userid ? <div className="flex items-center cursor-pointer" onClick={() => popupWindow(record.root?.id)}>
          <p className="text-xs text-[white] bg-[#000] px-1 py-0.5 rounded">{record.root?.userid}</p>
        </div> : "";
      },
    },
    {
      title: t("member_count"),
      dataIndex: "member_count",
      key: "member_count",
      render: (_, record) => {
        // Count children in the tree structure
        const childCount = (record as any).children?.length || 0;
        return childCount > 0 ? childCount : 0;
      },
    },
    {
      title: t("nickname"),
      dataIndex: "profile.nickname",
      key: '"Profile"."nickname"',
      render: (_, { profile }) => 
        profile.nickname,
      },
    {
      title: t("status"),
      dataIndex: "status",
      key: "status",
      render: (text) => (
        USER_STATUS[text]
      ),
    },
    {
      title: t("entry/exit"),
      dataIndex: "status",
      key: "status",
      render: (_, record) => [
        <Button
          title={t("deposit/withdraw")}
          variant="outlined"
          color="blue"
          key={"deposit"}
          onClick={() => onPayment(record)}
        >
          {t("deposit/withdraw")}
        </Button>,
        <Button
          title={t("points") + "+"}
          variant="outlined"
          color="blue"
          key={"point"}
          onClick={() => onPointsManagement(record)}
        >
          {t("points") + "+"}
        </Button>,
      ],
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
      title: t("rollingRate"),
      dataIndex: "profile.roll",
      key: "rollingRate",
      render: (_, record) => {
        // Safely access live, slot, hold with fallback to 0 if not present
        const live = record?.live ?? 0;
        const slot = record?.slot ?? 0;
        const hold = record?.hold ?? 0;
        // The original renders 0/0/0/0/0/0/0/0 for missing, so we keep the placeholders
        // If you want to append more data, expand as needed
        return `${live}/${slot}/${hold}/0/0/0/0/0/0/0`;
      },
    },
    {
      title: t("rolling"),
      dataIndex: "profile",
      key: "profile",
      render: (_, { profile }) => (profile && typeof profile.roll !== 'undefined' ? formatNumber(profile.roll) : '-'),
    },
    {
      title: t("losingRate"),
      dataIndex: "losingRate",
      key: "losingRate",
      render: (_, record) => {
        return `0/0/0/0/0/0/0/0/0/0/0`;
      },
    },
    {
      title: t("losing"),
      dataIndex: "losing",
      key: "losing",
      render: (_, record) => {
        return `0`;
      },
    },
    {
      title: t("membership"),
      dataIndex: "membership",
      key: "membership",
      render: (_, record) => [
        <Button
          title={t("domainRegistration")}
          variant="outlined"
          color="blue"
          key={"domainRegistration"}
          onClick={() => onDomainRegister(record)}
        >
          {t("domainRegistration")}
        </Button>,
        <Button
          title={t("losingRollingSetting")}
          variant="outlined"
          color="blue"
          key={"losingRollingSetting"}
          onClick={() => onLosingRollingSetting(record)}
        >
          {t("losingRollingSetting")}
        </Button>,
        // <Button title={t("move")} variant="outlined" color="blue" key={"move"}>
        //   {t("move")}
        // </Button>,
        // <Button
        //   title={t("lower")}
        //   variant="outlined"
        //   color="blue"
        //   key={"lower"}
        // >
        //   {t("lower")}
        // </Button>,
      ],
    },
    // {
    //   title: t("shortcut"),
    //   dataIndex: "shortcut",
    //   key: "shortcut",
    //   render: () => [
    //     <Button title={t("money")} variant="outlined" color="red" key={"money"}>
    //       {t("money")}
    //     </Button>,
    //     <Button title={t("bet")} variant="outlined" color="blue" key={"bet"}>
    //       {t("bet")}
    //     </Button>,
    //   ],
    // },
    {
      title: t("action"),
      key: "action",
      fixed: "right",
      render: (_, record) => (
        <Space.Compact size="small" className="gap-2">
          <Popconfirm
            title={t("confirmSure")}
            onConfirm={
              record.status === "A"
                ? () => onBlockUser(record)
                : () => onApproveUser(record)
            }
            description={
              record.status === "A" ? t("blockMessage") : t("approveMessage")
            }
          >
            {record.status === "A" ? (
              <Button
                title={t("block")}
                icon={<BiBlock />}
                variant="outlined"
                color="orange"
              />
            ) : (
              <Button
                title={t("approve")}
                variant="outlined"
                color="default"
                icon={<PiUserCircleCheckLight />}
              />
            )}
          </Popconfirm>

          <Popconfirm
            title={t("confirmSure")}
            onConfirm={() => onInactivateUser(record)}
            description={t("dormancyMessage") || "Are you sure you want to set this user to dormancy?"}
          >
            <Button
              title={t("dormancy")}
              variant="outlined"
              color="default"
              icon={<GiNightSleep />}
            />
          </Popconfirm>
          
          <Popconfirm
            title={t("confirmSure")}
            onConfirm={() => onDeleteUser(record)}
            description={t("deleteMessage") || "Are you sure you want to delete this user?"}
          >
            <Button
              title={t("delete")}
              variant="outlined"
              color="danger"
              icon={<BiTrash />}
            />
          </Popconfirm>
        </Space.Compact>
      ),
    },
  ];

  const tabItems = [
    {
      label: t("basicInformation"),
      key: "basic",
      children: <BasicInformation user={currentUser!} />,
    },
    {
      label: t("blackSearch"),
      key: "blackSearch",
      children: (
        <div>
          <Input />
        </div>
      ),
    },
    {
      label: t("bettingSettings"),
      key: "bettingSettings",
      children: (
        <div>
          <Input />
        </div>
      ),
    },
    {
      label: t("deposit/withdraw"),
      key: "deposit/withdraw",
      children: (
        <div>
          <Input />
        </div>
      ),
    },
    {
      label: t("noteList"),
      key: "noteList",
      children: (
        <div>
          <Input />
        </div>
      ),
    },
    {
      label: t("serviceCenter"),
      key: "serviceCenter",
      children: (
        <div>
          <Input />
        </div>
      ),
    },
    {
      label: t("accountInquirySetting"),
      key: "accountInquirySetting",
      children: (
        <div>
          <Input />
        </div>
      ),
    },
    {
      label: t("subscriptionSetting"),
      key: "subscriptionSetting",
      children: (
        <div>
          <Input />
        </div>
      ),
    },
    {
      label: t("directMemberList"),
      key: "directMemberList",
      children: (
        <div>
          <Input />
        </div>
      ),
    },
    {
      label: t("recommendedMembers"),
      key: "recommendedMembers",
      children: (
        <div>
          <Input />
        </div>
      ),
    },
    {
      label: t("subMembers"),
      key: "subMembers",
      children: (
        <div>
          <Input />
        </div>
      ),
    },
    {
      label: t("integratedMoneyDetail"),
      key: "integratedMoneyDetail",
      children: (
        <div>
          <Input />
        </div>
      ),
    },
    {
      label: t("pointDetail"),
      key: "pointDetail",
      children: (
        <div>
          <Input />
        </div>
      ),
    },
    {
      label: t("couponDetail"),
      key: "couponDetail",
      children: (
        <div>
          <Input />
        </div>
      ),
    },
    {
      label: t("losingHistory"),
      key: "losingHistory",
      children: (
        <div>
          <Input />
        </div>
      ),
    },
    {
      label: t("rollingHistory"),
      key: "rollingHistory",
      children: (
        <div>
          <Input />
        </div>
      ),
    },
    {
      label: t("bettingHistory"),
      key: "bettingHistory",
      children: (
        <div>
          <Input />
        </div>
      ),
    },
    {
      label: t("activityHistory"),
      key: "activityHistory",
      children: (
        <div>
          <Input />
        </div>
      ),
    },
    {
      label: t("informationChangeHistory"),
      key: "informationChangeHistory",
      children: (
        <div>
          <Input />
        </div>
      ),
    },
    {
      label: t("generalStatistics"),
      key: "generalStatistics",
      children: (
        <div>
          <Input />
        </div>
      ),
    },
  ];

  const losingRollingTabItems = [
    // Main categories
    { label: t("losingSetting"), key: "losingSetting" },
    // { label: t("losingSetting(Lotus/MGM)"), key: "losingSetting(Lotus/MGM)" },
    // { label: t("losingSetting(Touch/Game)"), key: "losingSetting(Touch/Game)" },
    { label: t("rolling(Casino/Slots/Hold'em)"), key: "rolling(Casino/Slots/Hold'em)" },
    // { label: t("rolling(Sports/VirtualGame)"), key: "rolling(Sports/VirtualGame)" },
    // { label: t("rolling(Lotus/MGM)"), key: "rolling(Lotus/MGM)" },
    // { label: t("rolling(Touch/Game)"), key: "rolling(Touch/Game)" },
    // { label: t("rollingOption(Video)"), key: "rollingOption(Video)" },
    // Game providers and platforms (partial, rest will be added in next edit)
    // { label: t("algCasino"), key: "algCasino" },
    // { label: t("ejugi"), key: "ejugi" },
    // { label: t("TVBet"), key: "TVBet" },
    // { label: t("AsiaGaming"), key: "AsiaGaming" },
    // { label: t("Vegas"), key: "Vegas" },
    // { label: t("7Mjobs"), key: "7Mjobs" },
    // { label: t("WMCasino"), key: "WMCasino" },
    // { label: t("oneTouch"), key: "oneTouch" },
    // { label: t("midas"), key: "midas" },
    // { label: t("pragmatic"), key: "pragmatic" },
    // { label: t("mtvGaming"), key: "mtvGaming" },
    // { label: t("oriental"), key: "oriental" },
    // { label: t("vivienne"), key: "vivienne" },
    // { label: t("taishan"), key: "taishan" },
    // { label: t("secuNine"), key: "secuNine" },
    // { label: t("Evolution"), key: "Evolution" },
    // { label: t("Allbet"), key: "Allbet" },
    // { label: t("Hilton Casino"), key: "Hilton Casino" },
    // { label: t("UIG Casino"), key: "UIG Casino" },
    // { label: t("Playtech"), key: "Playtech" },
    // { label: t("Bombay Casino"), key: "Bombay Casino" },
    // { label: t("Dream Gaming"), key: "Dream Gaming" },
    // { label: t("Lucky Streak"), key: "Lucky Streak" },
    // { label: t("XPro Gaming"), key: "XPro Gaming" },
    // { label: t("Royal Casino"), key: "Royal Casino" },
    // { label: t("sexy casino"), key: "sexy casino" },
    // { label: t("Gameplay"), key: "Gameplay" },
    // { label: t("Skywind"), key: "Skywind" },
    // { label: t("88 Casino"), key: "88 Casino" },
    // { label: t("Bota Casino"), key: "Bota Casino" },
    // { label: t("Dowin"), key: "Dowin" },
    // { label: t("Portomaso"), key: "Portomaso" },
    // { label: t("Micro"), key: "Micro" },
    // { label: t("Cagayan"), key: "Cagayan" },
    // { label: t("Vivogaming"), key: "Vivogaming" },
    // { label: t("BetgamesTV"), key: "BetgamesTV" },
    // { label: t("Big Casino"), key: "Big Casino" },
    // { label: t("Vivitek"), key: "Vivitek" },
    // { label: t("Wazdan"), key: "Wazdan" },
    // { label: t("Gameplay Slots"), key: "Gameplay Slots" },
    // { label: t("Platypus"), key: "Platypus" },
    // { label: t("Lucky Games"), key: "Lucky Games" },
    // { label: t("Bungo"), key: "Bungo" },
    // { label: t("Playtech slots"), key: "Playtech slots" },
    // { label: t("Real-time gaming"), key: "Real-time gaming" },
    // { label: t("lightning box"), key: "lightning box" },
    // { label: t("Playful"), key: "Playful" },
    // { label: t("August"), key: "August" },
    // { label: t("Pop okay"), key: "Pop okay" },
    // { label: t("iron dog"), key: "iron dog" },
    // { label: t("TomHonGaming"), key: "TomHonGaming" },
    // { label: t("Quick Spin"), key: "Quick Spin" },
    // { label: t("Gemjix"), key: "Gemjix" },
    // { label: t("mascot"), key: "mascot" },
    // { label: t("Omi Gaming"), key: "Omi Gaming" },
    // { label: t("Habanero"), key: "Habanero" },
    // { label: t("GMW slot"), key: "GMW slot" },
    // { label: t("Igrosoft"), key: "Igrosoft" },
    // { label: t("BTG Slots"), key: "BTG Slots" },
    // { label: t("Aspect Gaming"), key: "Aspect Gaming" },
    // { label: t("Onlyplay"), key: "Onlyplay" },
    // { label: t("Slot mill"), key: "Slot mill" },
    // { label: t("Live22"), key: "Live22" },
    // { label: t("Phoenix"), key: "Phoenix" },
    // { label: t("boomerang"), key: "boomerang" },
    // { label: t("1x2 Gaming"), key: "1x2 Gaming" },
    // { label: t("Snowborne"), key: "Snowborne" },
    // { label: t("Betrade"), key: "Betrade" },
    // { label: t("B Gaming"), key: "B Gaming" },
    // { label: t("Gaming Soft"), key: "Gaming Soft" },
    // { label: t("Lilkingdom"), key: "Lilkingdom" },
    // { label: t("Smart Soft"), key: "Smart Soft" },
    // { label: t("Dream Tech"), key: "Dream Tech" },
    // { label: t("Thunder Kick"), key: "Thunder Kick" },
    // { label: t("WACS"), key: "WACS" },
    // { label: t("Spike Games"), key: "Spike Games" },
    // { label: t("Genesis"), key: "Genesis" },
    // { label: t("Evoplay"), key: "Evoplay" },
    // { label: t("Red Tiger"), key: "Red Tiger" },
    // { label: t("Kagaming"), key: "Kagaming" },
    // { label: t("ELK"), key: "ELK" },
    // { label: t("Fugaso"), key: "Fugaso" },
    // { label: t("Skywind Slots"), key: "Skywind Slots" },
    // { label: t("Play and Go"), key: "Play and Go" },
    // { label: t("Lady Luck"), key: "Lady Luck" },
    // { label: t("Concept Gaming"), key: "Concept Gaming" },
    // { label: t("Booming"), key: "Booming" },
    // { label: t("Jilli"), key: "Jilli" },
    // { label: t("Netgaming"), key: "Netgaming" },
    // { label: t("Net game"), key: "Net game" },
    // { label: t("Classic Casino"), key: "Classic Casino" },
    // { label: t("Elysium"), key: "Elysium" },
    // { label: t("Nolimit City"), key: "Nolimit City" },
    // { label: t("Spinominal"), key: "Spinominal" },
    // { label: t("Relax"), key: "Relax" },
    // { label: t("Micro Slot"), key: "Micro Slot" },
    // { label: t("scrap paper"), key: "scrap paper" },
    // { label: t("Amatik"), key: "Amatik" },
    // { label: t("Dragonsoft"), key: "Dragonsoft" },
    // { label: t("Evolution Slots"), key: "Evolution Slots" },
    // { label: t("Yggdrasil"), key: "Yggdrasil" },
    // { label: t("Pachai"), key: "Pachai" },
    // { label: t("Speedo"), key: "Speedo" },
    // { label: t("Flow"), key: "Flow" },
    // { label: t("revolver"), key: "revolver" },
    // { label: t("Ejugi slot"), key: "Ejugi slot" },
    // { label: t("Aristo Slots"), key: "Aristo Slots" },
    // { label: t("7Mojos Slots"), key: "7Mojos Slots" },
    // { label: t("Spearhead"), key: "Spearhead" },
    // { label: t("Push Gaming"), key: "Push Gaming" },
    // { label: t("Expanse"), key: "Expanse" },
    // { label: t("Betsoft"), key: "Betsoft" },
    // { label: t("Bellatra"), key: "Bellatra" },
    // { label: t("Woohoo Games"), key: "Woohoo Games" },
    // { label: t("Star Games"), key: "Star Games" },
    // { label: t("Secure Nine Slots"), key: "Secure Nine Slots" },
    // { label: t("Folder Player"), key: "Folder Player" },
    // { label: t("AvatarUX"), key: "AvatarUX" },
    // { label: t("Patagonia"), key: "Patagonia" },
    // { label: t("Bifigames"), key: "Bifigames" },
    // { label: t("Novomatic"), key: "Novomatic" },
    // { label: t("Nextspin"), key: "Nextspin" },
    // { label: t("One Touch Slot"), key: "One Touch Slot" },
    // { label: t("Play line"), key: "Play line" },
    // { label: t("Red Lake"), key: "Red Lake" },
    // { label: t("NetEnt"), key: "NetEnt" },
    // { label: t("Asian Slots"), key: "Asian Slots" },
    // { label: t("Split Rock"), key: "Split Rock" },
    // { label: t("Paris Play"), key: "Paris Play" },
    // { label: t("Punta Gaming"), key: "Punta Gaming" },
    // { label: t("Platin Gaming"), key: "Platin Gaming" },
    // { label: t("The Slot Show"), key: "The Slot Show" },
    // { label: t("Man collar"), key: "Man collar" },
    // { label: t("Game Art"), key: "Game Art" },
    // { label: t("Triple Profit"), key: "Triple Profit" },
    // { label: t("Just Play"), key: "Just Play" },
    // { label: t("Retro Gaming"), key: "Retro Gaming" },
    // { label: t("Spade Gaming"), key: "Spade Gaming" },
    // { label: t("World Match"), key: "World Match" },
    // { label: t("Caleta Gaming"), key: "Caleta Gaming" },
    // { label: t("Interch"), key: "Interch" },
    // { label: t("Playstar"), key: "Playstar" },
    // { label: t("Oriental Slots"), key: "Oriental Slots" },
    // { label: t("Pragmatic Slots"), key: "Pragmatic Slots" },
    // { label: t("Hacksogaming"), key: "Hacksogaming" },
    // { label: t("iSoftBet"), key: "iSoftBet" },
    // { label: t("Mabrik"), key: "Mabrik" },
    // { label: t("Vivienne slot"), key: "Vivienne slot" },
    // { label: t("Fijisoft"), key: "Fijisoft" },
    // { label: t("Calamba"), key: "Calamba" },
    // { label: t("Fields Game"), key: "Fields Game" },
    // { label: t("Chiron"), key: "Chiron" },
    // { label: t("Eurasia Gaming"), key: "Eurasia Gaming" },
    // { label: t("jenny"), key: "jenny" },
    // { label: t("Blueprint"), key: "Blueprint" },
    // { label: t("Games Lab"), key: "Games Lab" },
    // { label: t("Vivigames"), key: "Vivigames" },
    // { label: t("Phantasma"), key: "Phantasma" },
    // { label: t("Mobilat"), key: "Mobilat" },
    // { label: t("Reelplay"), key: "Reelplay" },
    // { label: t("7777gaming"), key: "7777gaming" },
    // { label: t("Gamefish Global"), key: "Gamefish Global" },
    // { label: t("Chance"), key: "Chance" },
    // { label: t("Top Trend"), key: "Top Trend" },
    // { label: t("Linder"), key: "Linder" },
    // { label: t("SVR Gaming"), key: "SVR Gaming" },
    // { label: t("Nagagames"), key: "Nagagames" },
    // { label: t("Sure Powerball 3 minutes (Sureman)"), key: "Sure Powerball 3 minutes (Sureman)" },
    // { label: t("Sure Powerball 2 minutes (Sureman)"), key: "Sure Powerball 2 minutes (Sureman)" },
    // { label: t("N Powerball 3 minutes (named)"), key: "N Powerball 3 minutes (named)" },
    // { label: t("Sure Powerball 1 minute (Sureman)"), key: "Sure Powerball 1 minute (Sureman)" },
    // { label: t("N Powerball 5 minutes (named)"), key: "N Powerball 5 minutes (named)" },
    // { label: t("Entry Speed ​​Kino (Entry)"), key: "Entry Speed ​​Kino (Entry)" },
    // { label: t("Ripple Ball 3 minutes (Bepick)"), key: "Ripple Ball 3 minutes (Bepick)" },
    // { label: t("Ripple Ball 5 minutes (Bepick)"), key: "Ripple Ball 5 minutes (Bepick)" },
    // { label: t("Netball 5 Minute Powerball (Bepick)"), key: "Netball 5 Minute Powerball (Bepick)" },
    // { label: t("Donghaeng Powerball (Entry)"), key: "Donghaeng Powerball (Entry)" },
    // { label: t("Netball 1 Minute Powerball (Bepick)"), key: "Netball 1 Minute Powerball (Bepick)" },
    // { label: t("Netball 2 Minute Powerball (Bepick)"), key: "Netball 2 Minute Powerball (Bepick)" },
    // { label: t("Netball 3 Minute Powerball (Bepick)"), key: "Netball 3 Minute Powerball (Bepick)" },
    // { label: t("Netball 4 Minute Powerball (Bepick)"), key: "Netball 4 Minute Powerball (Bepick)" },
    // { label: t("Mega Ball (Mega)"), key: "Mega Ball (Mega)" },
    // { label: t("PBG (Private Powerball)"), key: "PBG (Private Powerball)" },
    // { label: t("EVO Powerball 1 turn (EVO)"), key: "EVO Powerball 1 turn (EVO)" },
    // { label: t("EVO Powerball 2 Turns (EVO)"), key: "EVO Powerball 2 Turns (EVO)" },
    // { label: t("EVO Powerball 3 Turns (EVO)"), key: "EVO Powerball 3 Turns (EVO)" },
    // { label: t("EVO Powerball 4 Turns (EVO)"), key: "EVO Powerball 4 Turns (EVO)" },
    // { label: t("EVO Powerball 5 Turns (EVO)"), key: "EVO Powerball 5 Turns (EVO)" },
    // { label: t("W Powerball (Bepick)"), key: "W Powerball (Bepick)" },
    // { label: t("Coin Powerball 3 minutes (Bepick)"), key: "Coin Powerball 3 minutes (Bepick)" },
    // { label: t("Coin Powerball 5 minutes (Bepick)"), key: "Coin Powerball 5 minutes (Bepick)" },
    // { label: t("Running Ball Space 8 (Named)"), key: "Running Ball Space 8 (Named)" },
    // { label: t("EuroMillions 1 Minute Powerball (BePick)"), key: "EuroMillions 1 Minute Powerball (BePick)" },
    // { label: t("EuroMillions 5 Minute Powerball (BePick)"), key: "EuroMillions 5 Minute Powerball (BePick)" },
    // { label: t("EuroMillions 3 Minute Powerball (BePick)"), key: "EuroMillions 3 Minute Powerball (BePick)" },
    // { label: t("Running Ball Maze 2 (Named)"), key: "Running Ball Maze 2 (Named)" },
    // { label: t("Europa Powerball (Europa)"), key: "Europa Powerball (Europa)" },
    // { label: t("Red Powerball (Named)"), key: "Red Powerball (Named)" },
    // { label: t("Next Powerball (Next)"), key: "Next Powerball (Next)" },
    // { label: t("Gaepan Powerball 1 (One Line)"), key: "Gaepan Powerball 1 (One Line)" },
    // { label: t("Donghaeng Powerball - Random Ball (Donghaeng)"), key: "Donghaeng Powerball - Random Ball (Donghaeng)" },
    // { label: t("Ripple Ball (Ripple)"), key: "Ripple Ball (Ripple)" },
    // { label: t("Coin Powerball 1 minute (play score)"), key: "Coin Powerball 1 minute (play score)" },
    // { label: t("Coin Powerball 2 minutes (Play Score)"), key: "Coin Powerball 2 minutes (Play Score)" },
    // { label: t("Running Ball Speed ​​4 (Named)"), key: "Running Ball Speed ​​4 (Named)" },
    // { label: t("Running Ball Speed ​​6 (Named)"), key: "Running Ball Speed ​​6 (Named)" },
    // { label: t("SK Powerball (SK)"), key: "SK Powerball (SK)" },
    // { label: t("PBG Powerball (Bepick)"), key: "PBG Powerball (Bepick)" },
    // { label: t("Europa Speed ​​Kino (Europa)"), key: "Europa Speed ​​Kino (Europa)" },
    // { label: t("EOS5 Minute Powerball (Entry)"), key: "EOS5 Minute Powerball (Entry)" },
    // { label: t("EOS3 Minute Powerball (Entry)"), key: "EOS3 Minute Powerball (Entry)" },
    // { label: t("EOS4 Minute Powerball (Entry)"), key: "EOS4 Minute Powerball (Entry)" },
    // { label: t("EOS1 Minute Powerball (Entry)"), key: "EOS1 Minute Powerball (Entry)" },
    // { label: t("EOS2 Minute Powerball (Entry)"), key: "EOS2 Minute Powerball (Entry)" },
    // { label: t("Japan Lotto (Bepick)"), key: "Japan Lotto (Bepick)" },
    // { label: t("Bogle Powerball (Bepick)"), key: "Bogle Powerball (Bepick)" },
    // { label: t("Donghaeng Powerball (Donghaeng)"), key: "Donghaeng Powerball (Donghaeng)" },
    // { label: t("Donghaeng Speed ​​Kino (Bepick)"), key: "Donghaeng Speed ​​Kino (Bepick)" },
    // { label: t("Random Powerball 5 minutes (Bepick)"), key: "Random Powerball 5 minutes (Bepick)" },
    // { label: t("Token Powerball (Token)"), key: "Token Powerball (Token)" },
    // { label: t("Random Powerball 3 minutes (Bepick)"), key: "Random Powerball 3 minutes (Bepick)" },
    // { label: t("Jumanji (Score 888)"), key: "Jumanji (Score 888)" },
    // { label: t("Donghaeng Kinosadari (Bepic)"), key: "Donghaeng Kinosadari (Bepic)" },
    // { label: t("Next Baccarat (Next)"), key: "Next Baccarat (Next)" },
    // { label: t("Bat and Wolf (Lucky Seven)"), key: "Bat and Wolf (Lucky Seven)" },
    // { label: t("Dragon Tiger (Sky Park)"), key: "Dragon Tiger (Sky Park)" },
    // { label: t("Odd or Even (Sky Park)"), key: "Odd or Even (Sky Park)" },
    // { label: t("Nine Ball (Crown)"), key: "Nine Ball (Crown)" },
    // { label: t("N Power Ladder 3 minutes (named)"), key: "N Power Ladder 3 minutes (named)" },
    // { label: t("N Power Ladder 5 minutes (named)"), key: "N Power Ladder 5 minutes (named)" },
    // { label: t("The flatbed truck ladder (score 888)"), key: "The flatbed truck ladder (score 888)" },
    // { label: t("Bogle Ladder 1 minute (one line)"), key: "Bogle Ladder 1 minute (one line)" },
    // { label: t("Bogle Ladder 3 minutes (one line)"), key: "Bogle Ladder 3 minutes (one line)" },
    // { label: t("Spear and Shield (Sporup)"), key: "Spear and Shield (Sporup)" },
    // { label: t("Europakinosadder (Europa)"), key: "Europakinosadder (Europa)" },
    // { label: t("Nine (Jolly)"), key: "Nine (Jolly)" },
    // { label: t("Next Ladder (Next)"), key: "Next Ladder (Next)" },
    // { label: t("Speed ​​Baccarat (Sky Park)"), key: "Speed ​​Baccarat (Sky Park)" },
    // { label: t("Open Baccarat (One Line)"), key: "Open Baccarat (One Line)" },
    // { label: t("Split Casino (Split)"), key: "Split Casino (Split)" },
    // { label: t("Sun & Moon (Game Zone)"), key: "Sun & Moon (Game Zone)" },
    // { label: t("Star Bridge 1 minute (Bosscore)"), key: "Star Bridge 1 minute (Bosscore)" },
    // { label: t("Heat Ladder 1 minute (Sporup)"), key: "Heat Ladder 1 minute (Sporup)" },
    // { label: t("Star Bridge 2 minutes (Bosscore)"), key: "Star Bridge 2 minutes (Bosscore)" },
    // { label: t("Penalty Kick (Lucky Seven)"), key: "Penalty Kick (Lucky Seven)" },
    // { label: t("Gaepansutda 3 (one line)"), key: "Gaepansutda 3 (one line)" },
    // { label: t("Star Bridge 3 minutes (Bosscore)"), key: "Star Bridge 3 minutes (Bosscore)" },
    // { label: t("Heat Ladder 3 minutes (Sporup)"), key: "Heat Ladder 3 minutes (Sporup)" },
    // { label: t("Seotda (Crown)"), key: "Seotda (Crown)" },
    // { label: t("New Zealand Ladder 3 minutes (one line)"), key: "New Zealand Ladder 3 minutes (one line)" },
    // { label: t("New Zealand Ladder 5 minutes (one line)"), key: "New Zealand Ladder 5 minutes (one line)" },
    // { label: t("Europa Power Ladder (Europa)"), key: "Europa Power Ladder (Europa)" },
    // { label: t("Ripple Ladder 5 minutes (Bepick)"), key: "Ripple Ladder 5 minutes (Bepick)" },
    // { label: t("Ripple Ladder 3 minutes (Bepick)"), key: "Ripple Ladder 3 minutes (Bepick)" },
    // { label: t("New Zealand Ladder 1 minute (one line)"), key: "New Zealand Ladder 1 minute (one line)" },
    // { label: t("SK Ladder 3 minutes (SK)"), key: "SK Ladder 3 minutes (SK)" },
    // { label: t("Spider (Jolly)"), key: "Spider (Jolly)" },
    // { label: t("Dragon & Tiger (Jolly)"), key: "Dragon & Tiger (Jolly)" },
    // { label: t("Gold Pig Ladder (Game Star)"), key: "Gold Pig Ladder (Game Star)" },
    // { label: t("Dice (Skypark)"), key: "Dice (Skypark)" },
    // { label: t("Coin Ladder 2 minutes (Play Score)"), key: "Coin Ladder 2 minutes (Play Score)" },
    // { label: t("Coin Ladder 1 minute (Play Score)"), key: "Coin Ladder 1 minute (Play Score)" },
    // { label: t("Dog and Cat (Lucky Seven)"), key: "Dog and Cat (Lucky Seven)" },
    // { label: t("Next Ring (Next)"), key: "Next Ring (Next)" },
    // { label: t("Ladder 7 (Lucky Seven)"), key: "Ladder 7 (Lucky Seven)" },
    // { label: t("Companion ladder (companion)"), key: "Companion ladder (companion)" },
    // { label: t("Entry Keyno Ladder (Entry)"), key: "Entry Keyno Ladder (Entry)" },
    // { label: t("Timo (Jolly)"), key: "Timo (Jolly)" },
    // { label: t("Dog board hole (one line)"), key: "Dog board hole (one line)" },
    // { label: t("Mini Baccarat (Crown)"), key: "Mini Baccarat (Crown)" },
    // { label: t("Odd or Even (Crown)"), key: "Odd or Even (Crown)" },
    // { label: t("Power Ladder (Entry)"), key: "Power Ladder (Entry)" },
    // { label: t("Darts (Game Zone)"), key: "Darts (Game Zone)" },
    // { label: t("Coin Ladder 5 minutes (Bepick)"), key: "Coin Ladder 5 minutes (Bepick)" },
    // { label: t("Coin Ladder 3 minutes (Bepick)"), key: "Coin Ladder 3 minutes (Bepick)" },
    // { label: t("Ryan Muji (Game Star)"), key: "Ryan Muji (Game Star)" },
    // { label: t("Power Kino Ladder (Entry)"), key: "Power Kino Ladder (Entry)" },
    // { label: t("Dice game (score 888)"), key: "Dice game (score 888)" },
    // { label: t("Sure Ladder 3 minutes (Sure Man)"), key: "Sure Ladder 3 minutes (Sure Man)" },
    // { label: t("Sure Ladder 2 minutes (Sureman)"), key: "Sure Ladder 2 minutes (Sureman)" },
    // { label: t("Sure Ladder 1 Minute (Sure Man)"), key: "Sure Ladder 1 Minute (Sure Man)" },
    // { label: t("Bogle Ladder (Bepic)"), key: "Bogle Ladder (Bepic)" },
    // { label: t("Sky Park Baccarat (Sky Park)"), key: "Sky Park Baccarat (Sky Park)" },
  ];

  useEffect(() => {
    setUsers(
      data?.response?.users?.map((u: any) => {
        return { ...u, key: u.id };
      }) ?? []
    );
    setTotal(data?.response?.total);
  }, [data]);

  useEffect(() => {
    setTreeUsers(buildTree(users ?? []));
    // setTotal(data?.response?.total);
  }, [users]);

  useEffect(() => {
    setDomains(
      domainData?.response?.domains?.map((d: Domain) => ({
        ...d,
        key: d.id,
        label: d.name,
        value: d.id,
      }))
    );
  }, [domainData]);

  useEffect(() => {
    refetch(tableOptions ?? undefined);
  }, [tableOptions]);

  return (
    <Layout>
      {contextHolder}
      <Content className="overflow-auto h-[calc(100vh-100px)] dark:bg-black">
        <Card
          title={t("admin/menu/partners")}
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
            </Space>
            <Space className="!w-full justify-between">
              <Space>
                {/* <Select
                  size="small"
                  placeholder="By Level"
                  className="min-w-28"
                  allowClear
                  onClear={onLevelChange}
                  options={[
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
                  }))}
                  onChange={onLevelChange}
                />
                <Select
                  size="small"
                  placeholder="By Field"
                  className="min-w-28"
                  allowClear
                  options={[
                    { label: t("all"), value: "" },
                    { label: t("userid"), value: "id" },
                    { label: t("nickname"), value: `"Profile"."nickname"` },
                    { label: t("phone"), value: `"Profile"."phone"` },
                    { label: t("holderName"), value: `"Profile"."holderName"` },
                    {
                      label: t("accountNumber"),
                      value: `"Profile"."accountNumber"`,
                    },
                    { label: t("usdtAddress"), value: `usdtAddress` },
                  ]}
                /> */}
                <Input.Search
                  size="small"
                  placeholder={t("idNicknameAccount")}
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
                {/* <Button size="small">{t("only_root_distributor")}</Button> */}
                {/* <Checkbox> {t("only_direct_member")}</Checkbox> */}
              </Space>
              <Button size="small" onClick={() => setRegModal(true)}>
                {t("register")}
              </Button>
            </Space>
          </Space>
          <Table<User>
            columns={columns}
            loading={loading}
            dataSource={treeUsers ?? []}
            className="w-full"
            size="small"
            scroll={{ x: "max-content" }}
            expandable={{
              onExpand,
            }}
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
            title={t("register")}
            open={regModal}
            onCancel={() => {
              setRegModal(false);
              form.resetFields();
            }}
            width={800}
            footer={null}
          >
            <Space direction="vertical" className="gap-2 w-full">
              <Form {...formItemLayout} form={form} onFinish={onRegisterUser}>
                <Form.Item name="domainId" label={t("domain")}>
                  <Select options={domains} />
                </Form.Item>
                <Form.Item name="role" label={t("role")} rules={[{ required: true, message: t("pleaseSelectRole") || "Please select a role" }]}>
                  <Select
                    options={[
                      {
                        label: t("admin") || "Admin",
                        value: "A",
                      },
                      {
                        label: t("partner") || "Partner",
                        value: "P",
                      },
                      {
                        label: t("user") || "User",
                        value: "U",
                      },
                    ]}
                    placeholder={t("selectRole") || "Select role"}
                  />
                </Form.Item>
                <Form.Item name="type" label={t("userType") || "User Type"} initialValue="G">
                  <Select
                    options={[
                      {
                        label: t("general") || "General",
                        value: "G",
                      },
                      {
                        label: t("test") || "Test",
                        value: "T",
                      },
                      {
                        label: t("interest") || "Interest",
                        value: "I",
                      },
                      {
                        label: t("working") || "Working",
                        value: "W",
                      },
                    ]}
                  />
                </Form.Item>
                <Form.Item name="settlementId" label={t("settlementMethod")}>
                  <Select
                    options={[
                      {
                        label: "(Be-Dang)*Rate%-Rolling-Rolling Conversion",
                        value: 1,
                      },
                      {
                        label: "(Be-Dang-Rolling-Rolling Conversion)*Rate%",
                        value: 2,
                      },
                      {
                        label:
                          "[(input-output)-(current money previous money)]*rate%-rolling",
                        value: 3,
                      },
                      {
                        label:
                          "[(deposit-withdrawal)-(current money-previous money)-rolling]*rate%",
                        value: 4,
                      },
                      {
                        label: "(input-output)*rate%",
                        value: 5,
                      },
                      {
                        label:
                          "[(input-output)-(current money-previous money)]*rate%",
                        value: 6,
                      },
                      {
                        label: "(Be-dang-Total Rolling)*Rate%",
                        value: 7,
                      },
                      {
                        label: "(B-Dang-orignal Rollling)*Rate%",
                        value: 8,
                      },
                      {
                        label:
                          "[(Be-dang)*Rate%-Rolling-RollingConversion]*0.9",
                        value: 9,
                      },
                    ]}
                  />
                </Form.Item>
                <Form.Item name="name" label={t("name")} rules={[{ required: true, message: t("pleaseEnterName") || "Please enter name" }]}>
                  <Input />
                </Form.Item>
                <Form.Item name="userid" label={t("userid")} rules={[{ required: true, message: t("pleaseEnterUserid") || "Please enter user ID" }]}>
                  <Input />
                </Form.Item>
                <Form.Item name="password" label={t("password")} rules={[{ required: true, message: t("pleaseEnterPassword") || "Please enter password" }]}>
                  <Input.Password />
                </Form.Item>
                <Form.Item name="nickname" label={t("nickname")} rules={[{ required: true, message: t("pleaseEnterNickname") || "Please enter nickname" }]}>
                  <Input />
                </Form.Item>
                <Form.Item name="phone" label={t("contact")}>
                  <Input />
                </Form.Item>
                <Form.Item name="holderName" label={t("holderName")}>
                  <Input />
                </Form.Item>
                <Form.Item name="bankId" label={t("bank")}>
                  <Select
                    options={bankData?.response?.banks?.map((b: Bank) => ({
                      label: b.name,
                      value: b.id,
                    }))}
                  />
                </Form.Item>
                <Form.Item name="accountNumber" label={t("accountNumber")}>
                  <Input />
                </Form.Item>
                <Form.Item name="secPassword" label={t("secPassword")}>
                  <Input.Password />
                </Form.Item>
                <Form.Item label={t("bettingHistoryReductionApplied")}>
                  <Radio.Group
                    optionType="button"
                    buttonStyle="solid"
                    options={[
                      {
                        label: t("live"),
                        value: "live",
                      },
                      {
                        label: t("slot"),
                        value: "slot",
                      },
                    ]}
                  />
                </Form.Item>
                <Form.Item label={t("rollingConversionAutoApprove")}>
                  <Switch />
                </Form.Item>
                <Form.Item label={t("virtualAccountAPI")}>
                  <Switch />
                </Form.Item>
                <Form.Item label={t("allowCreationSubDealers")}>
                  <Switch />
                </Form.Item>
                <Form.Item label={t("allowCreationLowerLevelDirectMembers")}>
                  <Switch />
                </Form.Item>
                <Form.Item {...tailFormItemLayout}>
                  <Button type="primary" htmlType="submit">
                    {t("register")}
                  </Button>
                </Form.Item>
              </Form>
            </Space>
          </Modal>

          <Modal
            title={t("domain")}
            open={domainModal}
            onCancel={() => setDomainModal(false)}
            footer={null}
          >
            <Space direction="vertical" className="gap-2 w-full">
            <Form
                key={currentUser?.id} // Force form to reset when user changes
                initialValues={{
                  userId: currentUser?.userid,
                  domainId: (currentUser as any)?.domainIds?.map((id: any) => String(id)) || [],
                }}
                onFinish={onUpdateDomain}
              >
                <Form.Item name={"userId"} label={t("userId")}>
                  <Input disabled />
                </Form.Item>
                <Form.Item name={"domainId"} label={t("selectDomains")}>
                  <Select mode="multiple" options={domains} />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit">
                    {t("register")}
                  </Button>
                </Form.Item>
              </Form>
            </Space>
          </Modal>

          <Modal
            title={t("payment")}
            open={moneyModal}
            onCancel={() => setMoneyModal(false)}
            footer={null}
          >
            <Space direction="vertical" className="gap-2 w-full">
              <Form
                // initialValues={{
                //   userId: currentUser?.userid,
                //   balance: currentUser?.profile?.balance,
                // }}
                form={form}
                onFinish={() => {
                  setMoneyModal(false);
                }}
              >
                <Form.Item
                  name="balance"
                  label={t("balance")}
                  initialValue={currentUser?.profile?.balance}
                >
                  <InputNumber readOnly  className="!w-full !p-0 !m-0"/>
                </Form.Item>
                <Space>
                  <Form.Item
                    name={"amount"}
                    label={t("amount")}
                    className="!flex !w-full !p-0 !m-0"
                  >
                    <InputNumber min={0} onChange={(value) => setAmount(value || 0)}/>
                  </Form.Item>
                  <Button type="primary" onClick={() => onDeposit()}>{t("deposit")}</Button>
                  <Button color="danger" variant="outlined" onClick={() => onWithdraw()}>
                    {t("withdraw")}
                  </Button>
                </Space>

                <Form.Item>
                  <Radio.Group
                    buttonStyle="solid"
                    className="w-full "
                    onChange={onAmountChange}
                  >
                    <Space.Compact className="w-full mt-4 flex flex-wrap gap-2">
                      <Radio.Button value={1000} onClick={() => setAmount(1000)}>
                        {formatNumber(1000)}
                      </Radio.Button>
                      <Radio.Button value={5000} onClick={() => setAmount(5000)}>
                        {formatNumber(5000)}
                      </Radio.Button>
                      <Radio.Button value={10000} onClick={() => setAmount(10000)}>
                        {formatNumber(10000)}
                      </Radio.Button>
                      <Radio.Button value={50000} onClick={() => setAmount(50000)}>
                        {formatNumber(50000)}
                      </Radio.Button>
                      <Radio.Button value={100000} onClick={() => setAmount(100000)}>
                        {formatNumber(100000)}
                      </Radio.Button>
                      <Radio.Button value={500000} onClick={() => setAmount(500000)}>
                        {formatNumber(500000)}
                      </Radio.Button>
                      <Radio.Button value={"max"} onClick={() => setAmount(10000000)}>MAX</Radio.Button>
                    </Space.Compact>
                  </Radio.Group>
                </Form.Item>
                <Form.Item>
                  <Button type="default" htmlType="submit">
                    {t("close")}
                  </Button>
                </Form.Item>
              </Form>
            </Space>
          </Modal>

          <Modal
            title={t("pointsManagement") || "Points Management"}
            open={pointsModal}
            onCancel={() => setPointsModal(false)}
            footer={null}
          >
            <Space direction="vertical" className="gap-2 w-full">
              <Form
                form={form}
                onFinish={() => {
                  setPointsModal(false);
                }}
              >
                <Form.Item
                  name="currentPoints"
                  label={t("currentPoints") || "Current Points"}
                  initialValue={currentUser?.profile?.point}
                >
                  <InputNumber readOnly className="!w-full !p-0 !m-0"/>
                </Form.Item>
                <Space>
                  <Form.Item
                    name={"pointAmount"}
                    label={t("amount")}
                    className="!flex !w-full !p-0 !m-0"
                  >
                    <InputNumber min={0} onChange={(value) => setPointAmount(value || 0)}/>
                  </Form.Item>
                  <Button type="primary" onClick={() => onAddPoints()}>
                    {t("add") || "Add"}
                  </Button>
                  <Button color="danger" variant="outlined" onClick={() => onSubtractPoints()}>
                    {t("subtract") || "Subtract"}
                  </Button>
                </Space>

                <Form.Item>
                  <Radio.Group
                    buttonStyle="solid"
                    className="w-full "
                    onChange={onPointAmountChange}
                  >
                    <Space.Compact className="w-full mt-4 flex flex-wrap gap-2">
                      <Radio.Button value={100} onClick={() => setPointAmount(100)}>
                        {formatNumber(100)}
                      </Radio.Button>
                      <Radio.Button value={500} onClick={() => setPointAmount(500)}>
                        {formatNumber(500)}
                      </Radio.Button>
                      <Radio.Button value={1000} onClick={() => setPointAmount(1000)}>
                        {formatNumber(1000)}
                      </Radio.Button>
                      <Radio.Button value={5000} onClick={() => setPointAmount(5000)}>
                        {formatNumber(5000)}
                      </Radio.Button>
                      <Radio.Button value={10000} onClick={() => setPointAmount(10000)}>
                        {formatNumber(10000)}
                      </Radio.Button>
                      <Radio.Button value={50000} onClick={() => setPointAmount(50000)}>
                        {formatNumber(50000)}
                      </Radio.Button>
                      <Radio.Button value={"max"} onClick={() => setPointAmount(10000000)}>MAX</Radio.Button>
                    </Space.Compact>
                  </Radio.Group>
                </Form.Item>
                <Form.Item>
                  <Button type="default" htmlType="submit">
                    {t("close")}
                  </Button>
                </Form.Item>
              </Form>
            </Space>
          </Modal>

          <Modal
            open={losingRollingModal}
            onCancel={() => {
              setLosingRollingModal(false);
              setCurrentUserChildren([]);
            }}  
            footer={null}
            className="losingRollingModal"
            width={"98%"}
          >
            <Card
              title={currentUser?.profile?.name + " " + "[ " + currentUser?.profile?.nickname + " ]" + " " + t("losingRollingSetting")}
              styles={{
                header: {
                  backgroundColor: '#000',
                  color:'#fff',
                  borderBottom: '1px solid #d9d9d9'
                }
              }}
            >
              <Space direction="vertical" className="gap-4 w-full">
                <div className="flex flex-wrap gap-2">
                  {losingRollingTabItems.map((item, index) => (
                    <Button
                      key={item.key}
                      type={selectedLosingRollingTab === item.key ? "primary" : "default"}
                      size="small"
                      onClick={() => {
                        setSelectedLosingRollingTab(item.key);
                        console.log(`Clicked: ${item.label}`);
                      }}
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedLosingRollingTab === "losingSetting" && <LosingSettingPage data={{ currentUser }}/>}
                  {selectedLosingRollingTab === "rolling(Casino/Slots/Hold'em)" && <RollingCasinoPage data={{ currentUser }}/>}
                </div>
              </Space>
            </Card>
          </Modal>
        </Card>
      </Content>
    </Layout>
  );
};

export default PartnerPage;
