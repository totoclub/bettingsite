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
  DatePicker,
  Switch,
  Modal,
  Form,
  InputNumber,
  notification,
  Select,
} from "antd";
import { GET_DOMAINS } from "@/actions/domain";
import { FilterDropdown } from "@refinedev/antd";
import type { TableProps } from "antd";
import { Content } from "antd/es/layout/layout";
import { useTranslations } from "next-intl";
import { useMutation, useQuery } from "@apollo/client";
import { BiTrash } from "react-icons/bi";
import { useQuill } from "react-quilljs";
import { PiPlus } from "react-icons/pi";
import { usePageTitle } from "@/hooks/usePageTitle";

// import HighlighterComp, { HighlighterProps } from "react-highlight-words";
import { parseTableOptions } from "@/lib";
import {
  // CREATE_BULLETIN,
  GET_BULLETINS,
  UPDATE_BULLETIN,
  DELETE_BULLETIN,
} from "@/actions/bulletin";

// const Highlighter = HighlighterComp as unknown as React.FC<HighlighterProps>;

// type UserIndex = keyof User;

const BulletinPage: React.FC = () => {
  usePageTitle("Admin - Bulletin Page");
  const [form] = Form.useForm();
  const t = useTranslations();
  const [tableOptions, setTableOptions] = useState<any>(null);
  const {
    loading: loadingDomain,
    data: domainData,
    // refetch: refetchDomain, // Removed since it's unused
  } = useQuery(GET_DOMAINS);

  const [total, setTotal] = useState<number>(0);
  const {loading, data, refetch } = useQuery(GET_BULLETINS);
  const [domains, setDomains] = useState<any[]>([]);
  const [bulletinAPI, context] = notification.useNotification();
  const [bulletins, setBulletins] = useState<any[]>([]);
  const [updateBulletin, { loading: loadingUpdate }] = useMutation(UPDATE_BULLETIN);
  // const [createBulletin, { loading: loadingCreate }] = useMutation(CREATE_BULLETIN);
  const [deleteBulletin, { loading: loadingDelete }] = useMutation(DELETE_BULLETIN);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const [currentBulletin, setCurrentBulletin] = useState<Bulletin | null>(null);

  // const onLevelChange = (evt: Bulletin, value: number) => {
  //   updateBulletin({
  //     variables: { 
  //       id: evt.id, 
  //       input: { 
  //         orderNum: value
  //       } 
  //     },
  //   }).then(() => {
  //     refetch(tableOptions);
  //   }).catch((err) => {
  //     console.error('Error updating notification order:', err);
  //     bulletinAPI.error({
  //       message: 'Failed to update notification order',
  //     });
  //   });
  // };
  console.log(bulletinAPI, 'bulletinAPI');
  useEffect(() => {
    if (domainData) {
      setDomains([
        ...(domainData.response?.domains?.map((d: Domain) => ({
          value: d.id,
          label: d.name,
        })) ?? []),
      ]);
    }
  }, [loadingDomain, domainData]);


  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ["bold", "italic", "underline", "strike", "blockquote"],
      [
        { list: "ordered" },
        { list: "bullet" },
        { indent: "-1" },
        { indent: "+1" },
      ],
      ["link", "image"],
      ["clean"],
    ],
  };
  
  const levels = [
    { value: '1', label: t("level1") },
    { value: '2', label: t("level2") },
    { value: '3', label: t("level3") },
    { value: '4', label: t("level4") },
    { value: '5', label: t("level5") },
    { value: '6', label: t("level6") },
    { value: '7', label: t("level7") },
    { value: '8', label: t("level8") },
    { value: '9', label: t("level9") },
    { value: '10', label: t("level10") },
    { value: '11', label: t("level11") },
    { value: '12', label: t("level12") },
    { value: '13', label: t("vip1") },
    { value: '14', label: t("vip2") },
    { value: '15', label: t("premium") },
  ];

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "list",
    // "bullet",
    "indent",
    "link",
    "image",
  ];

  const eventCategories = [
    { value: '1', label: t("test") },
  ];
  const { quill, quillRef } = useQuill({ modules, formats });
  // const { quill: quillOther, quillRef: quillRefOther } = useQuill({ modules, formats });

  const showModal = () => {
    setOpen(true);
  };
  const handleQuillChange = (editor: any, fieldName: string) => {
    if (editor) {
      const content = editor.root.innerHTML;
      form.setFieldValue(fieldName, content);
    }
  };

  useEffect(() => {
    if (quill) {
      const handleTextChange = () => handleQuillChange(quill, 'description');
      quill.on('text-change', handleTextChange);
      return () => {
        quill.off('text-change', handleTextChange);
      };
    }
  }, [quill]);

  // const onDomainChange = (evt: Bulletin, value: number[]) => {
  //   console.log('value', value);
  //   setTableOptions({
  //     ...tableOptions,
  //     filter: [
  //       ...(tableOptions?.filter?.filter((f: any) => f.field !== '"domains"."name"') ?? []),
  //       ...(value.length > 0
  //         ? [
  //             {
  //               field: '"domains"."name"',
  //               value: value.map(v => v === 0 ? "entire" : domains.find(d => d.value === v)?.label).filter(Boolean),
  //               op: "in",
  //             },
  //           ]
  //         : []),
  //     ],
  //   });
  //   // updateEvent({
  //   //   variables: {
  //   //     id: evt.id,
  //   //     input: {
  //   //       domainId: value.map((v: number) => v),
  //   //     },
  //   //   },
  //   // });
  // };

  const onStatusChange = (bulletin: Bulletin, checked: boolean) => {
    updateBulletin({
      variables: {
        id: bulletin.id,
        input: {
          top: checked,
        },
      },
    }).then((result) => {
      console.log({ result });
    });
  };

  const onCreate = (bulletin: Bulletin) => {
    console.log("Received values of form: ", bulletin);
    const newBulletin = {
      title: bulletin.title,
      description: bulletin.description,
      views: bulletin.views,
    };
    console.log(newBulletin, 'newBulletin')
    // createBulletin({ variables: { input: newNoti } })
    //   .then((res) => {
    //     if (res.data?.success) {
    //     }
    //     refetch();
    //     setOpen(false);
    //   })
    //   .catch((err) => {
    //     console.log({ err });
    //     bulletinAPI.error({
    //       message: err.message,
    //     });
    //   });
  };

  const onUpdate = (bulletin: Bulletin) => {
    const update = {
      title: bulletin.title,
      description: bulletin.description,
      category: bulletin.category,
      nickname: bulletin.nickname,
      recommend: bulletin.recommend,
      notrecommend: bulletin.notrecommend,
      level: bulletin.level,
      alllas: bulletin.alllas,
      memberId: bulletin.memberId,
      top: bulletin.top,
    };
    updateBulletin({
      variables: {
        id: currentBulletin!.id,
        input: update,
      },
    }).then(() => {
      setEditOpen(false);
      refetch(tableOptions);
    });
  };

  const onCancelEdit = () => {
    setCurrentBulletin(null);
    setEditOpen(false);
  };

  const onCancelNew = () => {
    setOpen(false);
  };

  const onDeleteBulletin = (bulletin: Bulletin) => {
    deleteBulletin({ variables: { id: bulletin.id } })
      .then((res) => {
        if (res.data?.success) {
        }
        refetch(tableOptions);
      })
      .catch((err) => {
        console.log({ err });
      });
  };

  const onChange: TableProps<Bulletin>["onChange"] = (
    pagination,
    filters,
    sorter,
    extra
  ) => {
    setTableOptions(parseTableOptions(pagination, filters, sorter, extra));
  };
  const columns: TableProps<Bulletin>["columns"] = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: t("author"),
      dataIndex: "user.userid",
      key: "user.userid",
      render: (_, record) => record?.user?.userid ?? '-',
      filterDropdown: (props) => (
        <FilterDropdown {...props}>
          <Input className="w-full" />
        </FilterDropdown>
      ),
    }, 
    {
      title: t("title"),
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <div className="flex items-center gap-2">
          <div>{text}</div>
        </div>
      ),
      filterDropdown: (props) => (
        <FilterDropdown {...props}>
          <Input className="w-full" />
        </FilterDropdown>
      ),
    },
    {
      title: t("views"),
      dataIndex: "views",
      key: "views",
      filterDropdown: (props) => (
        <FilterDropdown {...props}>
          <Input className="w-full" />
        </FilterDropdown>
      ),
    },
    {
      title: t("top"),
      dataIndex: "top",
      key: "top",
      render: (text: boolean, record: Bulletin) => {
        return (
          <Switch
            size="small"
            checked={text}
            onChange={(checked) => onStatusChange(record, checked)}
          />
        );
      },
    },
    {
      title: t("action"),
      key: "action",
      fixed: "right",
      render: (_, record) => (
        <Space.Compact size="small" className="gap-2">
          <Popconfirm
            title={t("confirmSure")}
            onConfirm={() => onDeleteBulletin(record)}
            description={t("deleteMessage")}
          >
            <Button
              title={t("delete")}
              loading={loadingDelete}
              variant="outlined"
              color="danger"
              icon={<BiTrash />}
            />
          </Popconfirm>
        </Space.Compact>
      ),
    },
  ];
  useEffect(() => {
    setBulletins(
      data?.response?.bulletins?.map((u: any) => {
        return { ...u, key: u.id };
      }) ?? []
    );
    setTotal(data?.response?.total);
  }, [data]);

  useEffect(() => {
    console.log({ tableOptions });
    refetch(tableOptions ?? undefined);
  }, [tableOptions]);

  return (
    <Layout>
      {context}
      <Content className="overflow-auto h-[calc(100vh-100px)] dark:bg-black">
        <Card
          title={t("admin/menu/bulletins")}
          classNames={{
            body: "!p-0",
          }}
          extra={
            <Button
              type="primary"
              size="small"
              onClick={showModal}
              icon={<PiPlus />}
            >
              {t("new")}
            </Button>
          }
        >
          {loading ? (
            ""
          ) : (
            <Table<Bulletin>
              columns={columns}
              loading={loading}
              dataSource={bulletins ?? []}
              className="w-full"
              size="small"
              scroll={{ x: "max-content" }}
              onChange={onChange}
              pagination={{
                showTotal(total, range) {
                  return t(`paginationLabel`, {
                    from: range[0],
                    to: range[1],
                    total: total,
                  });
                },
                total: total,
                showSizeChanger: true,
                pageSizeOptions: [10, 20, 50],
              }}
            />
          )}

          <Modal
            open={open}
            title={t("new")}
            footer={false}
            onCancel={onCancelNew}
          >
            <Form
              form={form}
              name="newForm"
              layout="vertical"
              clearOnDestroy
              onFinish={onCreate}
            >
              <div className="flex gap-2 w-full flex-row">
                <Form.Item name="domainId" label={t("domain")} className="w-full">
                  <Select options={domains} />
                </Form.Item>
                <Form.Item name="views" label={t("views")} className="w-full">
                  <InputNumber min={0} />
                </Form.Item>
              </div>
              <div className="w-full">
                <div className="w-full">{t("author")}</div>
                <div className="flex gap-2 w-full flex-row">
                  <Form.Item name="memberId"  className="w-full">
                    <Input placeholder={t("memberId")} />
                  </Form.Item>
                  <Form.Item name="nickname" className="w-full">
                    <Input placeholder={t("nickname")} />
                  </Form.Item>
                  <Form.Item name="level"  className="w-full">
                    <Select options={levels} />
                  </Form.Item>
                </div>
              </div>
              <div className="flex gap-2 w-full flex-row">
                <Form.Item name="recommend" label={t("recommend")}>
                  <InputNumber min={0} />
                </Form.Item>
                <Form.Item name="notrecommend" label={t("notrecommend")}>
                  <InputNumber min={0} />
                </Form.Item>
                <Form.Item name="top" label={t("topfixed")}>
                  <Switch />
                </Form.Item>
              </div>
              <div className="flex gap-2 w-full flex-row">
                <Form.Item name='title' label={t("title")}>
                  <Input placeholder={t("title")} />
                </Form.Item>
                <Form.Item name='eventCategory' label={t("eventCategory")}>
                  <Select options={eventCategories} />
                </Form.Item>
              </div>
              
              <Form.Item 
                name="description" 
                label={t("desc")}
                rules={[{ required: true, message: 'Please input the description!' }]}
              >
                <div ref={quillRef}></div>
              </Form.Item>
              <Form.Item>
                <Button htmlType="submit" loading={loadingUpdate}>
                  {t("submit")}
                </Button>
              </Form.Item>
            </Form>
          </Modal>

          <Modal
            title={t("edit")}
            open={editOpen}
            footer={false}
            onCancel={onCancelEdit}
            destroyOnHidden
          >
            <Form
              name="editForm"
              layout="vertical"
              initialValues={currentBulletin ?? {}}
              onFinish={onUpdate}
            >
              <Form.Item name="title" label={t("title")}>
                <Input />
              </Form.Item>
              <Form.Item name="description" label={t("desc")}>
                <Input.TextArea />
              </Form.Item>
              <Form.Item name="duration" label={t("duration")}>
                <DatePicker.RangePicker />
              </Form.Item>
              <Form.Item name="status" label={t("status")}>
                <Switch />
              </Form.Item>
              <Form.Item name="orderNum" label={t("orderNum")}>
                <InputNumber />
              </Form.Item>
              <Form.Item>
                <Button htmlType="submit" loading={loadingUpdate}>
                  {t("submit")}
                </Button>
              </Form.Item>
            </Form>
          </Modal>
        </Card>
      </Content>
    </Layout>
  );
};

export default BulletinPage;
