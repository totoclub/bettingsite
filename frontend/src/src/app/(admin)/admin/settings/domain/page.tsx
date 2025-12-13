"use client";
import React, { useEffect, useState } from "react";

import {
  Layout,
  Card,
  Form,
  Input,
  Radio,
  Select,
  Button,
  Switch,
  Divider,
  Flex,
  Descriptions,
  Space,
  message,
} from "antd";

import { Content } from "antd/es/layout/layout";

import { useTranslations } from "next-intl";
import { GET_DOMAINS, UPDATE_DOMAIN } from "@/actions/domain";
import { useMutation, useQuery } from "@apollo/client";

const DomainSettingPage: React.FC = () => {
  const t = useTranslations();
  const { data, loading, error } = useQuery(GET_DOMAINS);
  const [updateDomain] = useMutation(UPDATE_DOMAIN);
  const [domains, setDomains] = useState<any[]>([]);
  const opt = [
    {
      label: "WIN",
      value: "win",
    },
    {
      label: "SPORTS",
      value: "sports",
    },
    {
      label: "CUP",
      value: "cup",
    },
    {
      label: "OLEBET",
      value: "olebet",
    },
    {
      label: "SOUL",
      value: "soul",
    },
    {
      label: "DNINE",
      value: "dnine",
    },
    {
      label: "CHOCO",
      value: "choco",
    },
    {
      label: "COK",
      value: "cok",
    },
    {
      label: "OSAKA",
      value: "osaka",
    },
    {
      label: "BELLY",
      value: "belly",
    },
    {
      label: "HOUSE",
      value: "house",
    },
    {
      label: "BLUE",
      value: "blue",
    },
    {
      label: "vlvaldl",
      value: "vlvaldl",
    },
  ];

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
  const onSubmitSetting = (v: any) => {
    console.log("Form values received:", v);
    
    const { id, ...input } = v;
    
    console.log("Extracted ID:", id);
    console.log("Extracted input:", input);

    if (!id) {
      console.error("No ID found in form values");
      return;
    }

    // Ensure ID is a string as required by GraphQL
    const domainId = String(id);
    
    // Clean up the input - remove any undefined values
    const cleanInput = Object.fromEntries(
      Object.entries(input).filter(([_, value]) => value !== undefined)
    );

    console.log("Cleaned input:", cleanInput);

    updateDomain({
      variables: {
        id: domainId,
        input: cleanInput,
      },
    })
      .then((result) => {
        console.log("Update successful:", result);
        message.success("Domain updated successfully!");
      })
      .catch((error) => {
        console.error("Update failed:", error);
        message.error(`Update failed: ${error.message || 'Unknown error'}`);
      });
  };
  useEffect(() => {
    if (data?.response?.domains) {
      console.log("Domains loaded:", data.response.domains);
      setDomains(data.response.domains);
    }
  }, [data]);

  if (loading) {
    return (
      <Layout>
        <Content className="overflow-auto h-[calc(100vh-100px)] dark:bg-black">
          <Card title={t("admin/menu/domainSetting")} loading={true}>
            Loading domains...
          </Card>
        </Content>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Content className="overflow-auto h-[calc(100vh-100px)] dark:bg-black">
          <Card title={t("admin/menu/domainSetting")}>
            <div>Error loading domains: {error.message}</div>
          </Card>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout>
      <Content className="overflow-auto h-[calc(100vh-100px)] dark:bg-black">
        <Card title={t("admin/menu/domainSetting")}>
          <Radio.Group options={opt} optionType="button" buttonStyle="solid" />
          <Divider />
          <Flex wrap className="!w-full">
            {domains.length === 0 ? (
              <div>No domains found.</div>
            ) : (
              domains.map((d, index) => (
              <Card
                className="!w-1/3"
                title={`${index + 1} - ${d.name}`}
                type="inner"
                key={`${index + 1}-${d.name}`}
              >
                <Form
                  layout="horizontal"
                  labelCol={{ flex: "110px" }}
                  labelAlign="left"
                  labelWrap
                  wrapperCol={{ flex: 1 }}
                  className="w-full"
                  initialValues={d}
                  colon={false}
                  onFinish={onSubmitSetting}
                >
                  <Form.Item name="id" className="!p-0 !m-0" hidden>
                    <Input />
                  </Form.Item>
                  <div className="!w-full flex gap-2">
                    <Form.Item
                      label={t("memberLevelUponSignup")}
                      name="memberLevel"
                      className="w-1/2"
                    >
                      <Select
                        options={levelOption}
                        labelRender={labelRenderer}
                      />
                    </Form.Item>
                    <Form.Item
                      label={t("distributorLevelUponSignup")}
                      name="distributorLevel"
                      className="w-1/2"
                    >
                      <Select
                        options={levelOption}
                        labelRender={labelRenderer}
                      />
                    </Form.Item>
                  </div>
                  <Divider className="!p-0 !m-0" />
                  <Descriptions
                    layout="vertical"
                    bordered
                    column={4}
                    items={[
                      {
                        key: "1",
                        label: t("name"),
                        children: (
                          <Space
                            direction="vertical"
                            className="flex justify-between !gap-3"
                            align="center"
                          >
                            <div className="whitespace-nowrap">
                              {t("telegram")}
                            </div>
                            <div className="whitespace-nowrap">
                              {t("kakaoTalk")}
                            </div>
                            <div className="whitespace-nowrap">
                              {t("serviceCenter")}
                            </div>
                            <div className="whitespace-nowrap">
                              {t("liveDomain")}
                            </div>
                          </Space>
                        ),
                      },
                      {
                        key: "2",
                        label: t("status"),
                        children: (
                          <Space
                            direction="vertical"
                            className="justify-between"
                          >
                            <Form.Item name="useTelegram" className="!p-0 !m-0">
                              <Switch value={d.useTelegram}/>
                            </Form.Item>
                            <Form.Item
                              name="useKakaoTalk"
                              className="!p-0 !m-0"
                            >
                              <Switch value={d.useKakaoTalk}/>
                            </Form.Item>
                            <Form.Item
                              name="useServiceCenter"
                              className="!p-0 !m-0"
                            >
                              <Switch value={d.useServiceCenter}/>
                            </Form.Item>
                            <Form.Item
                              name="useLiveDomain"
                              className="!p-0 !m-0"
                            >
                              <Switch value={d.useLiveDomain}/>
                            </Form.Item>
                          </Space>
                        ),
                      },
                      {
                        key: "3",
                        label: t("currentName"),
                        children: (
                          <Space direction="vertical">
                            <Form.Item name="telegram" className="!p-0 !m-0">
                              <Input />
                            </Form.Item>
                            <Form.Item name="kakaoTalk" className="!p-0 !m-0">
                              <Input />
                            </Form.Item>
                            <Form.Item
                              name="serviceCenter"
                              className="!p-0 !m-0"
                            >
                              <Input />
                            </Form.Item>
                            <Form.Item name="liveDomain" className="!p-0 !m-0">
                              <Input />
                            </Form.Item>
                          </Space>
                        ),
                      },
                      {
                        key: "4",
                        label: t("link"),
                        children: (
                          <Space direction="vertical">
                            <Form.Item
                              name="telegramLink"
                              className="!p-0 !m-0"
                            >
                              <Input />
                            </Form.Item>

                            <Form.Item
                              name="kakaoTalkLink"
                              className="!p-0 !m-0"
                            >
                              <Input />
                            </Form.Item>
                            <Form.Item
                              name="serviceCenterLink"
                              className="!p-0 !m-0"
                            >
                              <Input />
                            </Form.Item>
                            <Form.Item
                              name="liveDomainLink"
                              className="!p-0 !m-0"
                            >
                              <Input />
                            </Form.Item>
                          </Space>
                        ),
                      },
                    ]}
                    className="!mb-4"
                  />
                  <Form.Item
                    labelCol={{ span: 8 }}
                    wrapperCol={{ span: 8, offset: 4 }}
                  >
                    <Button type="primary" htmlType="submit">
                      {t("submit")}
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
              ))
            )}
          </Flex>
        </Card>
      </Content>
    </Layout>
  );
};

export default DomainSettingPage;
