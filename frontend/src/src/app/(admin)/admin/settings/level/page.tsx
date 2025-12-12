"use client";
import React, { useState, useEffect } from "react";
import { Button, Card, Checkbox, DatePicker, Form, Input, InputNumber, Select, Switch, Table, message, Modal } from "antd";
import { useTranslations } from "next-intl";
import { levelAPI, Level, SurpriseBonus, ChargeBonusTableLevel } from "@/api/levelAPI";
import dayjs from "dayjs";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function LevelPage() {
    usePageTitle("Admin - Level Settings Page");
    const t = useTranslations();
    const [form] = Form.useForm();
    
    // State management
    const [levels, setLevels] = useState<Level[]>([]);
    const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState<'surpriseBonus' | 'chargingBonus' | null>(null);
    
    // Surprise Bonus state
    const [surpriseBonuses, setSurpriseBonuses] = useState<SurpriseBonus[]>([]);
    const [surpriseBonusForm] = Form.useForm();
    const [editingSurpriseBonus, setEditingSurpriseBonus] = useState<SurpriseBonus | null>(null);
    
    // Charge Bonus Table state
    const [chargeBonusTables, setChargeBonusTables] = useState<{[key: string]: ChargeBonusTableLevel[]}>({});
    
    const [bonus1AmountData, setBonusAmountData] = useState<{key: number, amount: number, bonus: number}[]>([]);
    const [bonus2AmountData, setBonus2AmountData] = useState<{key: number, amount: number, bonus: number}[]>([]);
    const [bonus3AmountData, setBonus3AmountData] = useState<{key: number, amount: number, bonus: number}[]>([]);
    const [bonus4AmountData, setBonus4AmountData] = useState<{key: number, amount: number, bonus: number}[]>([]);
    const [bonus5AmountData, setBonus5AmountData] = useState<{key: number, amount: number, bonus: number}[]>([]);

    const [bonus1TimeData, setBonus1TimeData] = useState<{key: number, from: string, to: string}[]>([]);
    const [bonus2TimeData, setBonus2TimeData] = useState<{key: number, from: string, to: string}[]>([]);
    const [bonus3TimeData, setBonus3TimeData] = useState<{key: number, from: string, to: string}[]>([]);
    const [bonus4TimeData, setBonus4TimeData] = useState<{key: number, from: string, to: string}[]>([]);
    const [bonus5TimeData, setBonus5TimeData] = useState<{key: number, from: string, to: string}[]>([]);
    
    // Separate input states for each charge bonus setting
    const [newAmount1, setNewAmount1] = useState<number | null>(null);
    const [newBonus1, setNewBonus1] = useState<number | null>(null);
    const [newAmount2, setNewAmount2] = useState<number | null>(null);
    const [newBonus2, setNewBonus2] = useState<number | null>(null);
    const [newAmount3, setNewAmount3] = useState<number | null>(null);
    const [newBonus3, setNewBonus3] = useState<number | null>(null);
    const [newAmount4, setNewAmount4] = useState<number | null>(null);
    const [newBonus4, setNewBonus4] = useState<number | null>(null);
    const [newAmount5, setNewAmount5] = useState<number | null>(null);
    const [newBonus5, setNewBonus5] = useState<number | null>(null);
    
    // Time input states for each charge bonus setting
    const [newTimeFrom1, setNewTimeFrom1] = useState<string>("");
    const [newTimeTo1, setNewTimeTo1] = useState<string>("");
    const [newTimeFrom2, setNewTimeFrom2] = useState<string>("");
    const [newTimeTo2, setNewTimeTo2] = useState<string>("");
    const [newTimeFrom3, setNewTimeFrom3] = useState<string>("");
    const [newTimeTo3, setNewTimeTo3] = useState<string>("");
    const [newTimeFrom4, setNewTimeFrom4] = useState<string>("");
    const [newTimeTo4, setNewTimeTo4] = useState<string>("");
    const [newTimeFrom5, setNewTimeFrom5] = useState<string>("");
    const [newTimeTo5, setNewTimeTo5] = useState<string>("");
    
    // Legacy state for backward compatibility
    const [newAmount, setNewAmount] = useState<number | null>(null);
    const [newBonus, setNewBonus] = useState<number | null>(null);

    // Data fetching functions
    const fetchLevels = async () => {
        setLoading(true);
        try {
            const response = await levelAPI.getLevels(1, 15);
            console.log("Fetched levels:", response.levels);
            setLevels(response.levels);
            if (response.levels.length > 0 && !selectedLevel) {
                // Find Level 1 specifically, or fall back to first level
                const level1 = response.levels.find(level => level.levelNumber === 1) || response.levels[0];
                
                // Transform JSON string fields to arrays for form display
                const transformedLevel = { ...level1 };
                
                // Parse applicabliltyByGame JSON string to array
                if (typeof transformedLevel.applicabliltyByGame === 'string' && transformedLevel.applicabliltyByGame) {
                    try {
                        (transformedLevel as any).applicabliltyByGame = JSON.parse(transformedLevel.applicabliltyByGame);
                    } catch (error) {
                        console.error("Error parsing applicabliltyByGame:", error);
                        (transformedLevel as any).applicabliltyByGame = [];
                    }
                } else {
                    (transformedLevel as any).applicabliltyByGame = [];
                }
                
                // Convert date strings to dayjs objects
                if ((transformedLevel as any).startDateAndTime) {
                    (transformedLevel as any).startDateAndTime = dayjs((transformedLevel as any).startDateAndTime);
                }
                if ((transformedLevel as any).deadline) {
                    (transformedLevel as any).deadline = dayjs((transformedLevel as any).deadline);
                }
                if ((transformedLevel as any).paymentDate) {
                    (transformedLevel as any).paymentDate = dayjs((transformedLevel as any).paymentDate);
                }
                
                setSelectedLevel(level1);
                form.setFieldsValue(transformedLevel);
                fetchSurpriseBonuses(level1.id!);
            }
        } catch (error) {
            message.error("Failed to fetch levels");
            console.error("Error fetching levels:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLevelSelect = (level: Level) => {
        console.log("Selected level:", level);
        setSelectedLevel(level);
        
        // Transform JSON string fields to arrays for form display
        const transformedLevel = { ...level };
        
        // Parse applicabliltyByGame JSON string to array
        if (typeof transformedLevel.applicabliltyByGame === 'string' && transformedLevel.applicabliltyByGame) {
            try {
                (transformedLevel as any).applicabliltyByGame = JSON.parse(transformedLevel.applicabliltyByGame);
            } catch (error) {
                console.error("Error parsing applicabliltyByGame:", error);
                (transformedLevel as any).applicabliltyByGame = [];
            }
        } else {
            (transformedLevel as any).applicabliltyByGame = [];
        }
        
        // Convert date strings to dayjs objects
        if ((transformedLevel as any).startDateAndTime) {
            (transformedLevel as any).startDateAndTime = dayjs((transformedLevel as any).startDateAndTime);
        }
        if ((transformedLevel as any).deadline) {
            (transformedLevel as any).deadline = dayjs((transformedLevel as any).deadline);
        }
        if ((transformedLevel as any).paymentDate) {
            (transformedLevel as any).paymentDate = dayjs((transformedLevel as any).paymentDate);
        }
        
        // Set form values for all forms
        form.setFieldsValue(transformedLevel);
        // Reset form validation
        form.resetFields();
        form.setFieldsValue(transformedLevel);
        fetchSurpriseBonuses(level.id!);
        // Fetch charge bonus tables for all charge bonus settings (1-5)
        for (let i = 1; i <= 5; i++) {
            fetchChargeBonusTables(level.id!, i);
        }
    };

    // Surprise Bonus functions
    const fetchSurpriseBonuses = async (levelId: number) => {
        try {
            const response = await levelAPI.getSurpriseBonuses(levelId);
            setSurpriseBonuses(response.surpriseBonuses);
        } catch (error) {
            message.error("Failed to fetch surprise bonuses");
            console.error("Error fetching surprise bonuses:", error);
        }
    };

    // Charge Bonus Table functions
    const fetchChargeBonusTables = async (levelId: number, chargeBonusNumber: number) => {
        try {
            const response = await levelAPI.getChargeBonusTableLevels(levelId, chargeBonusNumber);
            const key = `${levelId}-${chargeBonusNumber}`;
            setChargeBonusTables(prev => ({
                ...prev,
                [key]: response.chargeBonusTables
            }));
            
            // Update the specific bonus data arrays
            const amountTable = response.chargeBonusTables.find(t => t.type === "amount");
            const timeTable = response.chargeBonusTables.find(t => t.type === "time");
            
            if (amountTable && amountTable.data) {
                try {
                    const amountData = JSON.parse(amountTable.data);
                    const formattedAmountData = amountData.map((item: any, index: number) => ({
                        key: index + 1,
                        amount: item.amount,
                        bonus: item.bonus
                    }));
                    
                    // Update the correct bonus data array based on charge bonus number
                    switch (chargeBonusNumber) {
                        case 1:
                            setBonusAmountData(formattedAmountData);
                            break;
                        case 2:
                            setBonus2AmountData(formattedAmountData);
                            break;
                        case 3:
                            setBonus3AmountData(formattedAmountData);
                            break;
                        case 4:
                            setBonus4AmountData(formattedAmountData);
                            break;
                        case 5:
                            setBonus5AmountData(formattedAmountData);
                            break;
                    }
                } catch (error) {
                    console.error("Error parsing amount data:", error);
                }
            }
            
            if (timeTable && timeTable.data) {
                try {
                    const timeData = JSON.parse(timeTable.data);
                    const formattedTimeData = timeData.map((item: any, index: number) => ({
                        key: index + 1,
                        from: item.from,
                        to: item.to
                    }));
                    
                    // Update the correct bonus time data array based on charge bonus number
                    switch (chargeBonusNumber) {
                        case 1:
                            setBonus1TimeData(formattedTimeData);
                            break;
                        case 2:
                            setBonus2TimeData(formattedTimeData);
                            break;
                        case 3:
                            setBonus3TimeData(formattedTimeData);
                            break;
                        case 4:
                            setBonus4TimeData(formattedTimeData);
                            break;
                        case 5:
                            setBonus5TimeData(formattedTimeData);
                            break;
                    }
                } catch (error) {
                    console.error("Error parsing time data:", error);
                }
            }
        } catch (error) {
            console.error(`Error fetching charge bonus tables for level ${levelId}, charge ${chargeBonusNumber}:`, error);
            // Don't show error message for missing data, just log it
        }
    };

    const handleCreateSurpriseBonus = async (values: any) => {
        if (!selectedLevel?.id) return;
        
        setSaving(true);
        try {
            const nextNumber = surpriseBonuses.length + 1;
            await levelAPI.createSurpriseBonus(selectedLevel.id, {
                ...values,
                number: nextNumber,
                isActive: true,
            });
            message.success("Surprise bonus created successfully");
            setModalVisible(false);
            surpriseBonusForm.resetFields();
            fetchSurpriseBonuses(selectedLevel.id);
        } catch (error) {
            message.error("Failed to create surprise bonus");
            console.error("Error creating surprise bonus:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateSurpriseBonus = async (values: any) => {
        if (!editingSurpriseBonus?.id) return;
        
        setSaving(true);
        try {
            await levelAPI.updateSurpriseBonus(editingSurpriseBonus.id, values);
            message.success("Surprise bonus updated successfully");
            setModalVisible(false);
            surpriseBonusForm.resetFields();
            setEditingSurpriseBonus(null);
            if (selectedLevel?.id) {
                fetchSurpriseBonuses(selectedLevel.id);
            }
        } catch (error) {
            message.error("Failed to update surprise bonus");
            console.error("Error updating surprise bonus:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteSurpriseBonus = async (id: number) => {
        Modal.confirm({
            title: "Are you sure you want to delete this surprise bonus?",
            content: "This action cannot be undone.",
            onOk: async () => {
                try {
                    await levelAPI.deleteSurpriseBonus(id);
                    message.success("Surprise bonus deleted successfully");
                    if (selectedLevel?.id) {
                        fetchSurpriseBonuses(selectedLevel.id);
                    }
                } catch (error) {
                    message.error("Failed to delete surprise bonus");
                    console.error("Error deleting surprise bonus:", error);
                }
            },
        });
    };

    const handleUpdateLevel = async (values: any) => {
        if (!selectedLevel?.id) {
            message.error("No level selected");
            return;
        }
        
        setSaving(true);
        try {
            // Transform array fields to JSON strings before sending to backend
            const transformedValues = { ...values };
            
            // Convert applicabliltyByGame array to JSON string
            if (Array.isArray(transformedValues.applicabliltyByGame)) {
                transformedValues.applicabliltyByGame = JSON.stringify(transformedValues.applicabliltyByGame);
            }
            
            // Convert dayjs objects to ISO strings
            if (transformedValues.startDateAndTime && dayjs.isDayjs(transformedValues.startDateAndTime)) {
                transformedValues.startDateAndTime = transformedValues.startDateAndTime.toISOString();
            }
            if (transformedValues.deadline && dayjs.isDayjs(transformedValues.deadline)) {
                transformedValues.deadline = transformedValues.deadline.toISOString();
            }
            if (transformedValues.paymentDate && dayjs.isDayjs(transformedValues.paymentDate)) {
                transformedValues.paymentDate = transformedValues.paymentDate.toISOString();
            }
            
            const response = await levelAPI.updateLevel(selectedLevel.id, transformedValues);
            message.success("Level updated successfully");
            // Update the local state with the new values
            const updatedLevel = { ...selectedLevel, ...values };
            setSelectedLevel(updatedLevel);
            // Update the levels array
            setLevels(prevLevels => 
                prevLevels.map(level => 
                    level.id === selectedLevel.id ? updatedLevel : level
                )
            );
        } catch (error: any) {
            console.error("Error updating level:", error);
            if (error.response?.data?.validations) {
                message.error("Validation errors occurred");
                // Set form validation errors
                const validationErrors = error.response.data.validations;
                Object.keys(validationErrors).forEach(field => {
                    form.setFields([{
                        name: field,
                        errors: [validationErrors[field]]
                    }]);
                });
            } else {
                message.error(error.response?.data?.error || "Failed to update level");
            }
        } finally {
            setSaving(false);
        }
    };

    const handleBulkUpdate = async () => {
        setSaving(true);
        try {
            await levelAPI.bulkUpdateLevels(levels);
            message.success("Levels updated successfully");
            fetchLevels();
        } catch (error) {
            message.error("Failed to update levels");
            console.error("Error bulk updating levels:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleAddBonus = async (chargeBonusNumber: number, type: "amount" | "time") => {
        if (!selectedLevel?.id) return;
        
        try {
            // Get current data for this charge bonus and type
            const currentData = getChargeBonusTableData(chargeBonusNumber, type);
            
            // Create new entry based on type and charge bonus number
            let newEntry: any;
            let updatedData: any[];
            
            if (type === "amount") {
                // Get the correct amount and bonus values based on charge bonus number
                let amount, bonus;
                switch (chargeBonusNumber) {
                    case 1: amount = newAmount1; bonus = newBonus1; break;
                    case 2: amount = newAmount2; bonus = newBonus2; break;
                    case 3: amount = newAmount3; bonus = newBonus3; break;
                    case 4: amount = newAmount4; bonus = newBonus4; break;
                    case 5: amount = newAmount5; bonus = newBonus5; break;
                    default: return;
                }
                
                if (amount === null || bonus === null) return;
                
                newEntry = { amount, bonus };
                updatedData = [...currentData, newEntry];
                
                // Clear the specific input fields
                switch (chargeBonusNumber) {
                    case 1: setNewAmount1(null); setNewBonus1(null); break;
                    case 2: setNewAmount2(null); setNewBonus2(null); break;
                    case 3: setNewAmount3(null); setNewBonus3(null); break;
                    case 4: setNewAmount4(null); setNewBonus4(null); break;
                    case 5: setNewAmount5(null); setNewBonus5(null); break;
                }
            } else {
                // Get the correct time values based on charge bonus number
                let from, to;
                switch (chargeBonusNumber) {
                    case 1: from = newTimeFrom1; to = newTimeTo1; break;
                    case 2: from = newTimeFrom2; to = newTimeTo2; break;
                    case 3: from = newTimeFrom3; to = newTimeTo3; break;
                    case 4: from = newTimeFrom4; to = newTimeTo4; break;
                    case 5: from = newTimeFrom5; to = newTimeTo5; break;
                    default: return;
                }
                
                if (!from || !to) return;
                
                newEntry = { from, to };
                updatedData = [...currentData, newEntry];
                
                // Clear the specific input fields
                switch (chargeBonusNumber) {
                    case 1: setNewTimeFrom1(""); setNewTimeTo1(""); break;
                    case 2: setNewTimeFrom2(""); setNewTimeTo2(""); break;
                    case 3: setNewTimeFrom3(""); setNewTimeTo3(""); break;
                    case 4: setNewTimeFrom4(""); setNewTimeTo4(""); break;
                    case 5: setNewTimeFrom5(""); setNewTimeTo5(""); break;
                }
            }
            
            // Save to database
            await saveChargeBonusTableData(chargeBonusNumber, type, updatedData);
            
        } catch (error) {
            message.error(`Failed to add ${type === "amount" ? "bonus amount" : "bonus time"} entry`);
            console.error("Error adding bonus entry:", error);
        }
    };

    // Charge Bonus Table save functions
    const saveChargeBonusTableData = async (chargeBonusNumber: number, type: "amount" | "time", data: any[]) => {
        if (!selectedLevel?.id) return;
        
        try {
            const jsonData = JSON.stringify(data);
            await levelAPI.upsertChargeBonusTableLevel({
                levelId: selectedLevel.id,
                chargeBonusNumber,
                type,
                data: jsonData
            });
            message.success(`${type === "amount" ? "Bonus amount" : "Bonus time"} table saved successfully`);
            // Refresh the data
            fetchChargeBonusTables(selectedLevel.id, chargeBonusNumber);
        } catch (error) {
            message.error(`Failed to save ${type === "amount" ? "bonus amount" : "bonus time"} table`);
            console.error("Error saving charge bonus table:", error);
        }
    };

    const getChargeBonusTableData = (chargeBonusNumber: number, type: "amount" | "time") => {
        if (!selectedLevel?.id) return [];
        const key = `${selectedLevel.id}-${chargeBonusNumber}`;
        const tables = chargeBonusTables[key] || [];
        const table = tables.find(t => t.type === type);
        if (table && table.data) {
            try {
                return JSON.parse(table.data);
            } catch (error) {
                console.error("Error parsing charge bonus table data:", error);
                return [];
            }
        }
        return [];
    };

    // Empty functions for Apply To All Levels At Once buttons
    const handleApplyToAllLevels = () => {
        message.info("Apply to all levels functionality will be implemented later");
    };

    // Load data on component mount
    useEffect(() => {
        fetchLevels();
    }, []);
    const numberOptions = [
        {lable: t("noRestrictions"), value : 0},
        {lable: t("100"), value : 100},
        {lable: t("1 thousand"), value : 1000},
        {lable: t("10,000"), value : 10000},
        {lable: t("100,000"), value : 100000},
    ]

    const paymentCycleOptions = [
        {label: t("disposable"), value : "disposable"},
        {lable: t("daily"), value : "daily"},
        {lable: t("weekly"), value : "weekly"},
        {lable: t("monthly"), value : "monthly"},
    ]

    const applicabliltyByGameOptions = [
        {label: t("live"), value : "live"},
        {label: t("slot"), value : "slot"},
        {label: t("mini"), value : "mini"},
        {label: t("hold'em"), value : "hold'em"},
        {label: t("sports"), value : "sports"},
        {label: t("virtual"), value : "virtual"},
        {label: t("lotus"), value : "lotus"},
        {label: t("mgm"), value : "mgm"},
        {label: t("touch"), value : "touch"}
    ]

    const paymentMethodOptions = [
        {label: t("automatic"), value : "automatic"},
        {label: t("passive"), value : "passive"},
    ]

    const paymentFormulaOptions = [
        {label: t("(Deposit-Withdrawal-holdingMoney)*rate%"), value : "(Deposit-Withdrawal-holdingMoney)*rate%"},
        {label: t("(Be-dang)*rate%"), value : "(Be-dang)*rate%"},
        {label: t("(Be-dang-PointConversion)*rate%"), value : "(Be-dang-PointConversion)*rate%"},
        {label: t("(Input-Output)*Rate%"), value : "(Input-Output)*Rate%"},
        {label: t("(Deposit-Withdrawal-holdingMoney)*rate%"), value : "(Deposit-Withdrawal-holdingMoney)*rate%"},
    ]

    const referralOption = [
        {label: t("notInUse"), value : "notInUse"},
        {label: t("bettingAmount%"), value : "bettingAmount%"},
        {label: t("%ofWinnings"), value : "%ofWinnings"},
    ]

    const surpriseBonusTableColumns = [
        {title: t("number"), dataIndex: "number", key: "number", width: 100},
        {title: t("timeInterval"), dataIndex: "timeInterval", key: "timeInterval", width: 150},
        {title: t("surpriseBonus%"), dataIndex: "bonusPercent", key: "bonusPercent", width: 150, render: (value: number) => `${value}%`},
        {title: t("paymentStatus"), dataIndex: "paymentStatus", key: "paymentStatus", width: 150},
        {title: "-", dataIndex: "action", key: "action", width: 300, render: (text: string, record: SurpriseBonus) => {
            return <>
                <Button type="primary" onClick={() => {
                    setEditingSurpriseBonus(record);
                    surpriseBonusForm.setFieldsValue(record);
                    setModalType('surpriseBonus');
                    setModalVisible(true);
                }}>{t("change")}</Button>
                <Button type="primary" danger onClick={() => {
                    handleDeleteSurpriseBonus(record.id!);
                }}>{t("delete")}</Button>
            </>
        }},
    ]

    const bonusPaymentMethodOptions = [
        {label: t("unpaid"), value : "unpaid"},
        {label: t("payment1"), value : "payment1"},
        {label: t("payment2"), value : "payment2"},
        {label: t("payment3"), value : "payment3"},
        {label: t("payment4"), value : "payment4"},
        {label: t("payment5"), value : "payment5"}
    ]

    const surpriseBonusTableData = [
        {number: 1, timeInterval: t("timeInterval"), surpriseBonus: t("surpriseBonus"), paymentStatus: t("paymentStatus")},
        {number: 2, timeInterval: t("timeInterval"), surpriseBonus: t("surpriseBonus"), paymentStatus: t("paymentStatus")},
        {number: 3, timeInterval: t("timeInterval"), surpriseBonus: t("surpriseBonus"), paymentStatus: t("paymentStatus")},
        {number: 4, timeInterval: t("timeInterval"), surpriseBonus: t("surpriseBonus"), paymentStatus: t("paymentStatus")},
        {number: 5, timeInterval: t("timeInterval"), surpriseBonus: t("surpriseBonus"), paymentStatus: t("paymentStatus")},
    ]

    const chargingBonusTableColumns = [
        {title: t("member"), dataIndex: "member", key: "member", width: 250},
        {title: t("bonusPaymentMethod"), dataIndex: "bonusPaymentMethod", key: "bonusPaymentMethod", width: 100},
        {title: "-", dataIndex: "action", key: "action", width: 100, render: (text: string, record: any) => {
            return <>
                <Button type="primary" onClick={() => {
                    setModalType('chargingBonus');
                    setModalVisible(true);
                }}>{t("change")}</Button>
                <Button type="primary" danger onClick={() => {
                    // Handle delete logic
                }}>{t("delete")}</Button>
            </>
        }},
    ]

    return <Card title={t("admin/menu/levelSettingTitle")}>
        <div className="mb-4 flex justify-between items-center">
            <div className="flex flex-wrap gap-2">
                {levels.map((level) => (
                    <Button
                        key={level.id}
                        type={selectedLevel?.id === level.id ? "primary" : "default"}
                        onClick={() => handleLevelSelect(level)}
                    >
                        {level.name}
                    </Button>
                ))}
            </div>
            {/* <Button 
                onClick={handleBulkUpdate}
                loading={saving}
            >
                {t("applyToAllLevelsAtOnce")}
            </Button> */}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
            <Card 
                title={selectedLevel ? `${selectedLevel.name} ${t("setting")}` : t("selectLevelToEdit")}
                className="max-w-[1500px]"
                styles={{ header: { backgroundColor: 'black', color: 'white' } }}
                actions={[
                    <Button 
                        type="default" 
                        onClick={() => {
                            if (selectedLevel) {
                                form.submit();
                            }
                        }}
                        disabled={!selectedLevel || saving}
                        loading={saving}
                    >
                        {t("change")}
                    </Button>
                ]}
            >
                <div className="flex flex-row gap-2">
                    <div className="flex flex-col gap-2">
                        <Form
                            form={form}
                            onFinish={handleUpdateLevel}
                            labelCol={{ span: 12 }}
                        >
                            {/* Next level target value */}
                            <Form.Item label={t("nextLevelTargetValue")} name="nextLevelTargetValue">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("won")}</span>} />
                            </Form.Item>


                            <Form.Item label={t("minimumDepositAmount")} name="minimumDepositAmount">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("won")}</span>} />
                            </Form.Item>
                            <Form.Item label={t("minimumWithdrawalAmount")} name="minimumWithdrawalAmount">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("won")}</span>} />
                            </Form.Item>
                            <Form.Item label={t("maximumDepositAmount")} name="maximumDepositAmount">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("won")}</span>} />
                            </Form.Item>
                            <Form.Item label={t("maximumWithdrawalAmount")} name="maximumWithdrawalAmount">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("won")}</span>} />
                            </Form.Item>
                            <Form.Item label={t("maximumDailyWithdrawalAmount")} name="maximumDailyWithdrawalAmount">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("won")}</span>} />
                            </Form.Item>
                            <Form.Item label={t("pointsAwardedWhenWritingAPost")} name="pointsAwardedWhenWritingAPost">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("p")}</span>} />
                            </Form.Item>
                            <Form.Item label={t("dailyLimitOnNumberOfPostingPoints")} name="dailyLimitOnNumberOfPostingPoints">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("th")}</span>} />
                            </Form.Item>
                            <Form.Item label={t("depositAmountUnit")} name="depositAmountUnit">
                                <Select options={numberOptions} />
                            </Form.Item>
                            <Form.Item label={t("withdrawalAmountUnit")} name="withdrawalAmountUnit">
                                <Select options={numberOptions} />
                            </Form.Item>
                            <Form.Item label={t("enterPasswordWhenInquiringAboutAccount")} name="enterPasswordWhenInquiringAboutAccount">
                                <Switch className="flex justify-end"/>
                            </Form.Item>     
                            <Form.Item label={t("minigameSinglePoleDrawPoint")} name="minigameSinglePoleDrawPoint">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>     
                            <Form.Item label={t("minigameCombinationWinningPoints")} name="minigameCombinationWinningPoints">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>     
                            <Form.Item label={t("totalPointsLostInMinigames")} name="totalPointsLostInMinigames">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>     
                            <Form.Item label={t("sportsLiveSinglePollDrawPoints")} name="sportsLiveSinglePollDrawPoints">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>    
                            <Form.Item label={t("sportsLive2PoleDrawPoints")} name="sportsLive2PoleDrawPoints">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>    
                            <Form.Item label={t("sportsLive3PoleDrawPoints")} name="sportsLive3PoleDrawPoints">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>   
                            <Form.Item label={t("sportsLive4PoleDrawPoints")} name="sportsLive4PoleDrawPoints">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>   
                            <Form.Item label={t("sportsLiveDapolLostPoints")} name="sportsLiveDapolLostPoints">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>                      
                            <Form.Item label={t("sportsTotalLostPoints")} name="sportsTotalLostPoints">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item> 
                            <Form.Item label={t("sportsPreMatchSinglePoleDrawPoints")} name="sportsPreMatchSinglePoleDrawPoints">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item> 
                            <Form.Item label={t("sportsPreMatch2PoleDrawPoints")} name="sportsPreMatch2PoleDrawPoints">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item> 
                            <Form.Item label={t("sportsPreMatch3PoleDrawPoints")} name="sportsPreMatch3PoleDrawPoints">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item> 
                            <Form.Item label={t("sportsPreMatch4PoleDrawPoints")} name="sportsPreMatch4PoleDrawPoints">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>  
                            <Form.Item label={t("sportsPreMatchDapolLostPoints")} name="sportsPreMatchDapolLostPoints">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>       
                            <Form.Item label={t("sportsPreMatchTotalDrawPoints")} name="sportsPreMatchTotalDrawPoints">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>       
                            <Form.Item label={t("maximumSportsLotteryPoints1Day")} name="maximumSportsLotteryPoints1Day">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("p")}</span>} />
                            </Form.Item>  
                            <Form.Item label={t("virtualGameSinlePoleDrawPoints")} name="virtualGameSinlePoleDrawPoints">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>   
                            <Form.Item label={t("virtualGameDapolLosingPoints")} name="virtualGameDapolLosingPoints">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>   
                            <Form.Item label={t("virtualGameTotalLossPoints")} name="virtualGameTotalLossPoints">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>                                                                                                                  
                        </Form>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Form
                            form={form}
                            onFinish={handleUpdateLevel}
                            labelCol={{ span: 12 }}
                        >
                            <Form.Item label={t("casinoLiveMaximumRolling")} name="casinoLiveMaximumRolling">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>                                                                                                        
                            <Form.Item label={t("casinoLiveMinimumRolling")} name="casinoLiveMinimumRolling">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>                                                                                                        
                            <Form.Item label={t("casinoSlotsMaxRolling")} name="casinoSlotsMaxRolling">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>                                                                                                        
                            <Form.Item label={t("casinoSlotsMinimumRolling")} name="casinoSlotsMinimumRolling">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item> 
                            <Form.Item label={t("holdemPokerMaximumRolling")} name="holdemPokerMaximumRolling">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>    
                            <Form.Item label={t("holdemPokerMinimumRolling")} name="holdemPokerMinimumRolling">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>
                            <Form.Item label={t("minigameMinimumBetAmount")} name="minigameMinimumBetAmount">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>         
                            <Form.Item label={t("minigameMaxRolling")} name="minigameMaxRolling">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>  
                            <Form.Item label={t("minigameMinimumRolling")} name="minigameMinimumRolling">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>   
                            <Form.Item label={t("sportsMaxRolling")} name="sportsMaxRolling">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>
                            <Form.Item label={t("sportsMinimumRolling")} name="sportsMinimumRolling">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>
                            <Form.Item label={t("virtualGameMaximumRolling")} name="virtualGameMaximumRolling">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>
                            <Form.Item label={t("minimumRollingForVirtualGames")} name="minimumRollingForVirtualGames">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>
                            <Form.Item label={t("lotusMaxRolling")} name="lotusMaxRolling">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>
                            <Form.Item label={t("lotusMinimumRolling")} name="lotusMinimumRolling">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>
                            <Form.Item label={t("mgmMaxRolling")} name="mgmMaxRolling">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>
                            <Form.Item label={t("mgmMinimumRolling")} name="mgmMinimumRolling">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>
                            <Form.Item label={t("touchGameMinimumRolling")} name="touchGameMinimumRolling">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>
                            <Form.Item label={t("touchGameMaximumRolling")} name="touchGameMaximumRolling">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>
                            <Form.Item label={t("touchGameMinimumRolling")} name="touchGameMinimumRolling">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>
                            <Form.Item label={t("rollingCoversionMinimumAmount")} name="rollingCoversionMinimumAmount">
                                <InputNumber min={0}/>
                            </Form.Item>
                            <Form.Item label={t("rollingCoversionLimitPerDay")} name="rollingCoversionLimitPerDay">
                                <InputNumber min={0}/>
                            </Form.Item>
                            <Form.Item label={t("rollingCoversion1DayAmountLimit")} name="rollingCoversion1DayAmountLimit">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("min")}</span>} />
                            </Form.Item>
                            <Form.Item label={t("waitingTimeForReApplicationAfterExchangeIsCompleted")} name="waitingTimeForReApplicationAfterExchangeIsCompleted">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("min")}</span>} />
                            </Form.Item>
                            <Form.Item label={t("waitingTimeForReApplicationAfterChargingIsCompleted")} name="waitingTimeForReApplicationAfterChargingIsCompleted">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("min")}</span>} />
                            </Form.Item>
                            <Form.Item label={t("waitingTimeForCurrencyExchangeRequestAfterChargingIsCompleted")} name="waitingTimeForCurrencyExchangeRequestAfterChargingIsCompleted">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("min")}</span>} />
                            </Form.Item>
                            <Form.Item label={t("timeLimitForExchangeingMoreThanXTimesOnTheSameDay")} name="timeLimitForExchangeingMoreThanXTimesOnTheSameDay">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("min")}</span>} />
                            </Form.Item>
                            <Form.Item label={t("maximumAmountOfBettingHistoryReduction")} name="maximumAmountOfBettingHistoryReduction">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("won")}</span>} />
                            </Form.Item>
                            <Form.Item label={t("reduceBettingAmountPerDay")} name="reduceBettingAmountPerDay">
                                <InputNumber min={0} />
                            </Form.Item>
                        </Form>
                    </div>
                </div>
                <div className="flex flex-row gap-2">
                    <div className="flex flex-col gap-2">
                        <Form
                            form={form}
                            onFinish={handleUpdateLevel}
                            labelCol={{ span: 12 }}
                        >
                            <Form.Item label={t("minimumDepositAmount")} name="minimumDepositAmount">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("won")}</span>} />
                            </Form.Item>
                            <Form.Item label={t("minimumWithdrawalAmount")} name="minimumWithdrawalAmount">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("won")}</span>} />
                            </Form.Item>
                            <Form.Item label={t("maximumDepositAmount")} name="maximumDepositAmount">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("won")}</span>} />
                            </Form.Item>
                            <Form.Item label={t("maximumWithdrawalAmount")} name="maximumWithdrawalAmount">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("won")}</span>} />
                            </Form.Item>
                            <Form.Item label={t("maximumDailyWithdrawalAmount")} name="maximumDailyWithdrawalAmount">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("won")}</span>} />
                            </Form.Item>
                            <Form.Item label={t("pointsAwardedWhenWritingAPost")} name="pointsAwardedWhenWritingAPost">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("p")}</span>} />
                            </Form.Item>
                            <Form.Item label={t("dailyLimitOnNumberOfPostingPoints")} name="dailyLimitOnNumberOfPostingPoints">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("th")}</span>} />
                            </Form.Item>
                            <Form.Item label={t("depositAmountUnit")} name="depositAmountUnit">
                                <Select options={numberOptions} />
                            </Form.Item>
                            <Form.Item label={t("withdrawalAmountUnit")} name="withdrawalAmountUnit">
                                <Select options={numberOptions} />
                            </Form.Item>
                            <Form.Item label={t("enterPasswordWhenInquiringAboutAccount")} name="enterPasswordWhenInquiringAboutAccount">
                                <Switch className="flex justify-end"/>
                            </Form.Item>     
                            <Form.Item label={t("minigameSinglePoleDrawPoint")} name="minigameSinglePoleDrawPoint">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>     
                            <Form.Item label={t("minigameCombinationWinningPoints")} name="minigameCombinationWinningPoints">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>     
                            <Form.Item label={t("totalPointsLostInMinigames")} name="totalPointsLostInMinigames">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>     
                            <Form.Item label={t("sportsLiveSinglePollDrawPoints")} name="sportsLiveSinglePollDrawPoints">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>    
                            <Form.Item label={t("sportsLive2PoleDrawPoints")} name="sportsLive2PoleDrawPoints">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>    
                            <Form.Item label={t("sportsLive3PoleDrawPoints")} name="sportsLive3PoleDrawPoints">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>   
                            <Form.Item label={t("sportsLive4PoleDrawPoints")} name="sportsLive4PoleDrawPoints">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>   
                            <Form.Item label={t("sportsLiveDapolLostPoints")} name="sportsLiveDapolLostPoints">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>                      
                            <Form.Item label={t("sportsTotalLostPoints")} name="sportsTotalLostPoints">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item> 
                            <Form.Item label={t("sportsPreMatchSinglePoleDrawPoints")} name="sportsPreMatchSinglePoleDrawPoints">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item> 
                            <Form.Item label={t("sportsPreMatch2PoleDrawPoints")} name="sportsPreMatch2PoleDrawPoints">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item> 
                            <Form.Item label={t("sportsPreMatch3PoleDrawPoints")} name="sportsPreMatch3PoleDrawPoints">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item> 
                            <Form.Item label={t("sportsPreMatch4PoleDrawPoints")} name="sportsPreMatch4PoleDrawPoints">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>  
                            <Form.Item label={t("sportsPreMatchDapolLostPoints")} name="sportsPreMatchDapolLostPoints">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>       
                            <Form.Item label={t("sportsPreMatchTotalDrawPoints")} name="sportsPreMatchTotalDrawPoints">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>       
                            <Form.Item label={t("maximumSportsLotteryPoints1Day")} name="maximumSportsLotteryPoints1Day">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("p")}</span>} />
                            </Form.Item>  
                            <Form.Item label={t("virtualGameSinlePoleDrawPoints")} name="virtualGameSinlePoleDrawPoints">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>   
                            <Form.Item label={t("virtualGameDapolLosingPoints")} name="virtualGameDapolLosingPoints">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>   
                            <Form.Item label={t("virtualGameTotalLossPoints")} name="virtualGameTotalLossPoints">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>                                                                                                                  
                        </Form>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Form
                            form={form}
                            onFinish={handleUpdateLevel}
                            labelCol={{ span: 12 }}
                        >
                            <Form.Item label={t("casinoLiveMaximumRolling")} name="casinoLiveMaximumRolling">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>                                                                                                        
                            <Form.Item label={t("casinoLiveMinimumRolling")} name="casinoLiveMinimumRolling">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>                                                                                                        
                            <Form.Item label={t("casinoSlotsMaxRolling")} name="casinoSlotsMaxRolling">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>                                                                                                        
                            <Form.Item label={t("casinoSlotsMinimumRolling")} name="casinoSlotsMinimumRolling">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item> 
                            <Form.Item label={t("holdemPokerMaximumRolling")} name="holdemPokerMaximumRolling">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>    
                            <Form.Item label={t("holdemPokerMinimumRolling")} name="holdemPokerMinimumRolling">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>
                            <Form.Item label={t("minigameMinimumBetAmount")} name="minigameMinimumBetAmount">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>         
                            <Form.Item label={t("minigameMaxRolling")} name="minigameMaxRolling">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>  
                            <Form.Item label={t("minigameMinimumRolling")} name="minigameMinimumRolling">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>   
                            <Form.Item label={t("sportsMaxRolling")} name="sportsMaxRolling">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>
                            <Form.Item label={t("sportsMinimumRolling")} name="sportsMinimumRolling">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>
                            <Form.Item label={t("virtualGameMaximumRolling")} name="virtualGameMaximumRolling">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>
                            <Form.Item label={t("minimumRollingForVirtualGames")} name="minimumRollingForVirtualGames">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>
                            <Form.Item label={t("lotusMaxRolling")} name="lotusMaxRolling">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>
                            <Form.Item label={t("lotusMinimumRolling")} name="lotusMinimumRolling">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>
                            <Form.Item label={t("mgmMaxRolling")} name="mgmMaxRolling">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>
                            <Form.Item label={t("mgmMinimumRolling")} name="mgmMinimumRolling">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>
                            <Form.Item label={t("touchGameMinimumRolling")} name="touchGameMinimumRolling">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>
                            <Form.Item label={t("touchGameMaximumRolling")} name="touchGameMaximumRolling">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>
                            <Form.Item label={t("touchGameMinimumRolling")} name="touchGameMinimumRolling">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                            </Form.Item>
                            <Form.Item label={t("rollingCoversionMinimumAmount")} name="rollingCoversionMinimumAmount">
                                <InputNumber min={0}/>
                            </Form.Item>
                            <Form.Item label={t("rollingCoversionLimitPerDay")} name="rollingCoversionLimitPerDay">
                                <InputNumber min={0}/>
                            </Form.Item>
                            <Form.Item label={t("rollingCoversion1DayAmountLimit")} name="rollingCoversion1DayAmountLimit">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("min")}</span>} />
                            </Form.Item>
                            <Form.Item label={t("waitingTimeForReApplicationAfterExchangeIsCompleted")} name="waitingTimeForReApplicationAfterExchangeIsCompleted">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("min")}</span>} />
                            </Form.Item>
                            <Form.Item label={t("waitingTimeForReApplicationAfterChargingIsCompleted")} name="waitingTimeForReApplicationAfterChargingIsCompleted">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("min")}</span>} />
                            </Form.Item>
                            <Form.Item label={t("waitingTimeForCurrencyExchangeRequestAfterChargingIsCompleted")} name="waitingTimeForCurrencyExchangeRequestAfterChargingIsCompleted">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("min")}</span>} />
                            </Form.Item>
                            <Form.Item label={t("timeLimitForExchangeingMoreThanXTimesOnTheSameDay")} name="timeLimitForExchangeingMoreThanXTimesOnTheSameDay">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("min")}</span>} />
                            </Form.Item>
                            <Form.Item label={t("maximumAmountOfBettingHistoryReduction")} name="maximumAmountOfBettingHistoryReduction">
                                <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("won")}</span>} />
                            </Form.Item>
                            <Form.Item label={t("reduceBettingAmountPerDay")} name="reduceBettingAmountPerDay">
                                <InputNumber min={0} />
                            </Form.Item>
                        </Form>
                    </div>
                </div>
            </Card>
            <Card 
                title={t("level1PayBackSetting")}
                className="max-w-[500px]"
                styles={{ header: { backgroundColor: 'black', color: 'white' } }}
                actions={
                    [<Button 
                        type="default" 
                        onClick={() => {
                            if (selectedLevel) {
                                form.submit();
                            }
                        }}
                        disabled={!selectedLevel || saving}
                        loading={saving}
                    >{t("change")}</Button>,
                    // <Button type="default" onClick={() => {}}>{t("applyToAllLevelsAtOnce")}</Button>
                ]
                }
            >
                <Form
                    form={form}
                    onFinish={handleUpdateLevel}
                    labelCol={{ span: 12 }}
                >
                    <Form.Item label={t("paymentCycle")} name="paymentCycle">
                       <Select options={paymentCycleOptions} />
                    </Form.Item>
                    <Form.Item label={t("startDateAndTime")} name="startDateAndTime">
                       <DatePicker showTime />
                    </Form.Item>
                    <Form.Item label={t("deadline")} name="deadline">
                       <DatePicker showTime />
                    </Form.Item>
                    <Form.Item label={t("paymentDate")} name="paymentDate">
                       <DatePicker showTime />
                    </Form.Item>
                    <Form.Item label={t("applicabliltyByGame")} name="applicabliltyByGame">
                       <Checkbox.Group options={applicabliltyByGameOptions} />
                    </Form.Item>
                    <Form.Item label={t("paymentMethod")} name="paymentMethod">
                       <Select options={paymentMethodOptions} />
                    </Form.Item>
                    <Form.Item label={t("paymentFormula")} name="paymentFormula">
                       <Select options={paymentFormulaOptions} />
                    </Form.Item>
                    <Form.Item label={t("payback%")} name="payback%">
                       <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                    </Form.Item>
                    <Form.Item label={t("ifTheAmountIs(-),ItIsProcessedAs0")} name="ifTheAmountIs(-),ItIsProcessedAs0">
                       <Switch />
                    </Form.Item>
                    <Form.Item label={t("nonPaymentWhenDepositWithdrawalDifferenceIs(-)")} name="nonPaymentWhenDepositWithdrawalDifferenceIs(-)">
                       <Switch />
                    </Form.Item>
                    <Form.Item label={t("paymentToDistributorsAsWell")} name="paymentToDistributorsAsWell">
                       <Switch />
                    </Form.Item>
                    <Form.Item label={t("maximumPaymentAmount")} name="maximumPaymentAmount">
                       <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("won")}</span>} />
                    </Form.Item>
                    <Form.Item label={t("paymentUponDepositOfXOrMoreTimes")} name="paymentUponDepositOfXOrMoreTimes">
                       <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("episode")}</span>} />
                    </Form.Item>
                    <Form.Item label={t("paymentUponDepositForXDaysOrMore")} name="paymentUponDepositForXDaysOrMore">
                       <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("day")}</span>} />
                    </Form.Item>
                    <div className="text-red-500 bg-red-100 p-4">
                        <span>{t('paybacksArePaidBasedOnTheBettingStatisticsOfMembers,NotTheGeneralAgent,WithinAGivenTimeFrame')}</span>
                        <span>{t('toEliminateOmissionsInPaybackPointPayments,BettingStatisticsAreCalculatedBasedOnTheRegistrationTime,NotTheBettingTimeAsOnOtherPages')}</span>
                    </div>
                </Form>
            </Card>
            <Card
                title={t("level1SuddenBonusSetting")}
                className="max-w-[600px]"
                styles={{ header: { backgroundColor: 'black', color: 'white' } }}
                actions={
                    [
                    <Button 
                        type="default" 
                        onClick={() => {
                            if (selectedLevel) {
                                form.submit();
                            }
                        }}
                        disabled={!selectedLevel || saving}
                        loading={saving}
                    >{t("change")}</Button>,
                    // <Button type="default" onClick={() => {}}>{t("applyToAllLevelsAtOnce")}</Button>
                ]
                }
            >
                <Form
                    form={form}
                    onFinish={handleUpdateLevel}
                    labelCol={{ span: 12 }}
                >
                    <Form.Item label={t("restrictionsOnOtherBonusesBesidesSupriseBonuses")} name="restrictionsOnOtherBonusesBesidesSupriseBonuses">
                        <Switch />
                    </Form.Item>
                    <Form.Item label={t("restrictionsOnOtherRechargebonusesAfterTheSurpriseBonusIsPaid")} name="restrictionsOnOtherRechargebonusesAfterTheSurpriseBonusIsPaid">
                        <Switch />
                    </Form.Item>
                    <Form.Item label={t("surpriseBonusRestrictionsOnFirstDepositOrFirstDeposit")} name="surpriseBonusRestrictionsOnFirstDepositOrFirstDeposit">
                        <Switch />
                    </Form.Item>
                    <Form.Item label={t("surpriseBonusRestrictionAfterCashingOutWithinSurpriseBonusTime")} name="surpriseBonusRestrictionAfterCashingOutWithinSurpriseBonusTime">
                        <Switch />
                    </Form.Item>
                    <Button 
                        type="primary" 
                        onClick={() => {
                            setEditingSurpriseBonus(null);
                            surpriseBonusForm.resetFields();
                            setModalType('surpriseBonus');
                            setModalVisible(true);
                        }}
                        disabled={!selectedLevel}
                    >
                        {t("addSurpriseBonus")}
                    </Button>
                    <div>
                        <Table 
                            columns={surpriseBonusTableColumns} 
                            dataSource={surpriseBonuses} 
                            rowKey="id"
                            pagination={false}
                        />   
                    </div>
                </Form>
            </Card>
            <Card
                className="max-w-[500px] min-w-[500px]"
                styles={{ header: { backgroundColor: 'black', color: 'white' } }}
                title={t("settingUpLevel1ReferalBenefits")}
                actions={[
                <Button 
                    type="default" 
                    onClick={() => {
                        if (selectedLevel) {
                            form.submit();
                        }
                    }}
                    disabled={!selectedLevel || saving}
                    loading={saving}
                >{t("change")}</Button>,
                // <Button type="default" onClick={handleApplyToAllLevels}>{t("applyToAllLevelsAtOnce")}</Button>
            ]}
            >
                <Form form={form} onFinish={handleUpdateLevel} labelCol={{ span: 12 }}>
                    <Form.Item label={t("referralBenefitsMini")} name="referralBenefitsMini">
                        <div className="flex gap-2">
                            <Select options={referralOption} />
                            <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                        </div>
                    </Form.Item>
                    <Form.Item label={t("referralBenefitsVirtual")} name="referralBenefitsVirtual">
                        <div className="flex gap-2">
                            <Select options={referralOption} />
                            <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                        </div>
                    </Form.Item>
                    <Form.Item label={t("referralBenefitsSportsSinglePole")} name="referralBenefitsSportsSinglePole">
                        <div className="flex gap-2">
                            <Select options={referralOption} />
                            <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                        </div>
                    </Form.Item>
                    <Form.Item label={t("referralBenefitsSports2Pole")} name="referralBenefitsSports2Pole">
                        <div className="flex gap-2">
                            <Select options={referralOption} />
                            <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                        </div>
                    </Form.Item>
                    <Form.Item label={t("referralBenefitsSports3Pole")} name="referralBenefitsSports3Pole">
                        <div className="flex gap-2">
                            <Select options={referralOption} />
                            <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                        </div>
                    </Form.Item>
                    <Form.Item label={t("referralBenefitsSports4Pole")} name="referralBenefitsSports4Pole">
                        <div className="flex gap-2">
                            <Select options={referralOption} />
                            <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                        </div>
                    </Form.Item>
                    <div className="text-red-500 bg-red-100 p-4">
                        <span>{t("appliesInComjunctionWithTheSettingsInTheMemberDetailsPopUp")}</span>
                    </div>
                </Form>
            </Card>
            <Card
                className="max-w-[500px] min-w-[500px]"
                styles={{ header: { backgroundColor: 'black', color: 'white' } }}
                title={t("level1CharginBonusSelectionSetting")}
                actions={[
                <Button 
                    type="default" 
                    onClick={() => {
                        if (selectedLevel) {
                            form.submit();
                        }
                    }}
                    disabled={!selectedLevel || saving}
                    loading={saving}
                >{t("change")}</Button>,
                // <Button type="default" onClick={handleApplyToAllLevels}>{t("applyToAllLevelsAtOnce")}</Button>
            ]}
            >
                <Form form={form} onFinish={handleUpdateLevel} labelCol={{ span: 12 }}>
                    <Form.Item label={t("useTheRechargeBonousSelection")} name="useTheRechargeBonousSelection">
                        <Switch />
                    </Form.Item>
                    <Form.Item label={t("numberOfBonusPaymentTypes")} name="numberOfBonusPaymentTypes">
                        <div className="flex gap-2">
                            <InputNumber min={0}/>
                            <Button type="primary" onClick={() => {}}>{t("change")}</Button>
                        </div>
                    </Form.Item>
                    <div>
                        <Table columns={chargingBonusTableColumns} dataSource={[]} footer={
                            () => {
                                return <div className="flex justify-end w-full">
                                    <InputNumber min={0} className="min-w-[250px]"/>
                                    <Select options={bonusPaymentMethodOptions} className="min-w-[150px]"/>
                                    <Button type="primary" onClick={() => {}}>{t("add")}</Button>
                                </div>
                            }
                        }/>
                    </div>
                    {/* <div className="text-red-500 bg-red-100 p-4">
                        <span>{t("appliesInComjunctionWithTheSettingsInTheMemberDetailsPopUp")}</span>
                    </div> */}
                </Form>
            </Card>
            <Card
                className="max-w-[600px] min-w-[600px]"
                styles={{ header: { backgroundColor: 'black', color: 'white' } }}
                title={t("chargeBonus1Setting")}
                actions={[
                <Button 
                    type="default" 
                    onClick={() => {
                        if (selectedLevel) {
                            form.submit();
                        }
                    }}
                    disabled={!selectedLevel || saving}
                    loading={saving}
                >{t("change")}</Button>,
                // <Button type="default" onClick={handleApplyToAllLevels}>{t("applyToAllLevelsAtOnce")}</Button>
            ]}
            >
                <Form form={form} onFinish={handleUpdateLevel} labelCol={{ span: 10 }}>
                    <Form.Item label={t("firstDepositBonusWeekdays")} name="firstDepositBonusWeekdays">
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                    </Form.Item>
                    <Form.Item label={t("firstDepositBonusWeekends")} name="firstDepositBonusWeekends">
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                    </Form.Item>
                    <Form.Item label={t("everyDayBonusWeekday")} name="everyDayBonusWeekday">
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                    </Form.Item>
                    <Form.Item label={t("weekendBonus")} name="weekendBonus">
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                    </Form.Item>
                    <Form.Item label={t("signUpFirstDepositBonus")} name="signUpFirstDepositBonus">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                    </Form.Item>
                    <Form.Item label={t("maximumBonusMoney(1time)")} name="maximumBonusMoney(1time)">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("p")}</span>} />
                    </Form.Item>
                    <Form.Item label={t("maximumBonusMoney(1day)")} name="maximumBonusMoney(1day)">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("p")}</span>} />
                    </Form.Item>
                    <Form.Item label={t("referralBonus")} name="referralBonus">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                    </Form.Item>
                    <Form.Item label={t("depositPlusPriorityApplicationForFirstDepositUponSigningUp")} name="depositPlusPriorityApplicationForFirstDepositUponSigningUp">   
                        <Switch />
                    </Form.Item>
                    <Form.Item label={t("depositPlusPriorityApplicationForEachDeposit")} name="depositPlusPriorityApplicationForEachDeposit">   
                        <Switch />
                    </Form.Item>
                    <Form.Item label={t("rechargeBonusLimitMaximumAmountOfMoneyHeldPoints")} name="rechargeBonusLimitMaximumAmountOfMoneyHeldPoints">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("won")}</span>} />
                    </Form.Item>
                    <Form.Item label={t("sameDayFirstDepositBonusLimit(AfterWithdrawal)")} name="sameDayFirstDepositBonusLimit(AfterWithdrawal)">   
                        <Switch />
                    </Form.Item>
                    <Form.Item label={t("sameDayReplenishmentBonusLimit(AfterWithdrawal)")} name="sameDayReplenishmentBonusLimit(AfterWithdrawal)">   
                        <Switch />
                    </Form.Item>
                    <Form.Item label={t("replenishmentBonusLimit(AfterWithdrawal)")} name="replenishmentBonusLimit(AfterWithdrawal)">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("min")}</span>} />
                    </Form.Item>
                    <Form.Item label={t("sameDayRepleishmentBonus%(afterWithdrawal)")} name="sameDayRepleishmentBonus%(afterWithdrawal)">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                    </Form.Item>
                    <Form.Item label={t("restrictionsApplyAfterWithdrawalOfSurpriseBonus")} name="restrictionsApplyAfterWithdrawalOfSurpriseBonus">   
                        <Switch />
                    </Form.Item>
                    <Form.Item label={t("maximumNumberOfDailySurpriseBonusPayments")} name="maximumNumberOfDailySurpriseBonusPayments">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("times")}</span>} />
                    </Form.Item>
                    <Form.Item label={t("maximumNumberOfSurpriseBonusPaymentsPerTimePeriod")} name="maximumNumberOfSurpriseBonusPaymentsPerTimePeriod">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                    </Form.Item>
                    <Form.Item label={t("changeIndividualGameUsageStatus")} name="changeIndividualGameUsageStatus">   
                        <Switch />
                    </Form.Item>
                    {/* <Form.Item label={t("gameSpecificSettings")} name="gameSpecificSettings">   
                        <Checkbox.Group options={applicabliltyByGameOptions} />
                    </Form.Item> */}
                    {/* Bonus Amount Table */}
                    <Form.Item label={t("bonusAmountSettings")}>
                        <Table
                            dataSource={bonus1AmountData}
                            footer={() => (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center justify-between">
                                        <InputNumber
                                            min={0}
                                            value={newAmount1}
                                            onChange={setNewAmount1}
                                            style={{ width: 70 }}
                                            placeholder="Amount"
                                        />
                                        <span style={{ fontWeight: "bold", width: 45 }} className="justify-center flex">+</span>
                                        <InputNumber
                                            min={0}
                                            value={newBonus1}
                                            onChange={setNewBonus1}
                                            style={{ width: 70 }}
                                            placeholder="Bonus"
                                        />
                                    </div>
                                    <div className="flex w-full justify-center">
                                        <Button type="primary" size="small" onClick={() => handleAddBonus(1, "amount")}>
                                            {t("addition")}
                                        </Button>
                                    </div>
                                </div>
                            )}
                            pagination={false}
                            rowKey="key"
                            showHeader={false}
                            style={{ marginBottom: 16 }}
                            columns={[
                                {
                                    title: "",
                                    dataIndex: "amount",
                                    key: "amount",
                                    width: 70,
                                    render: (value: number) => (
                                        <InputNumber
                                            min={0}
                                            value={value}
                                            style={{ width: 70 }}
                                        />
                                    ),
                                },
                                {
                                    title: "+",
                                    dataIndex: "plus",
                                    key: "plus",
                                    width: 30,
                                    render: () => <span style={{ fontWeight: "bold" }} className="justify-center flex">+</span>,
                                },
                                {
                                    title: "",
                                    dataIndex: "bonus",
                                    key: "bonus",
                                    width: 70,
                                    render: (value: number) => (
                                        <InputNumber
                                            min={0}
                                            value={value}
                                            style={{ width: 70 }}
                                        />
                                    ),
                                },
                                {
                                    title: "",
                                    key: "actions",
                                    render: () => (
                                        <div className="flex justify-center items-center">
                                            <Button type="primary" size="small" style={{ marginRight: 8 }}>{t("change")}</Button>
                                            <Button type="primary" size="small" danger>{t("delete")}</Button>
                                        </div>
                                    ),
                                },
                            ]}
                        />
                    </Form.Item>

                    {/* Bonus Time Table */}
                    <Form.Item label={t("bonusTimeSettings")}>
                        <Table
                            dataSource={[
                                { key: 1, from: "21:00", to: "23:00" },
                                { key: 2, from: "02:00", to: "05:00" },
                            ]}
                            pagination={false}
                            rowKey="key"
                            showHeader={false}
                            style={{ marginBottom: 16 }}
                            footer={() => (
                                <div className="flex items-center ">
                                    <div className="flex items-center justify-between">
                                        <InputNumber
                                            min={0}
                                            value={newAmount}
                                            onChange={setNewAmount}
                                            style={{ width: 80 }}
                                            placeholder="Amount"
                                        />
                                        <span style={{ fontWeight: "bold", width: 15 }} className="justify-center flex"></span>
                                        <InputNumber
                                            min={0}
                                            value={newBonus}
                                            onChange={setNewBonus}
                                            style={{ width: 80 }}
                                            placeholder="Bonus"
                                        />
                                    </div>
                                    
                                    <Button type="primary" className="ml-4" size="small" onClick={() => handleAddBonus(2, "time")}>
                                        {t("addition")}
                                    </Button>
                                </div>
                            )}
                            columns={[
                                {
                                    title: "",
                                    dataIndex: "from",
                                    key: "from",
                                    width: 80,
                                    render: (value: string) => (
                                        <Input
                                            value={value}
                                            style={{ width: 80 }}
                                            placeholder="00:00"
                                        />
                                    ),
                                },
                                {
                                    title: "",
                                    dataIndex: "to",
                                    key: "to",
                                    width: 80,
                                    render: (value: string) => (
                                        <Input
                                            value={value}
                                            style={{ width: 80 }}
                                            placeholder="00:00"
                                        />
                                    ),
                                },
                                {
                                    title: "",
                                    key: "actions",
                                    width: 160,
                                    render: () => (
                                        <>
                                            <Button type="primary" size="small" style={{ marginRight: 8 }}>{t("change")}</Button>
                                            <Button type="primary" size="small" danger>{t("delete")}</Button>
                                        </>
                                    ),
                                },
                            ]}
                        />
                    </Form.Item>
                </Form>
            </Card>

            <Card
                className="max-w-[600px] min-w-[600px]"
                styles={{ header: { backgroundColor: 'black', color: 'white' } }}
                title={t("chargeBonus2Setting")}
                actions={[
                <Button 
                    type="default" 
                    onClick={() => {
                        if (selectedLevel) {
                            form.submit();
                        }
                    }}
                    disabled={!selectedLevel || saving}
                    loading={saving}
                >{t("change")}</Button>,
                // <Button type="default" onClick={handleApplyToAllLevels}>{t("applyToAllLevelsAtOnce")}</Button>
            ]}
            >
                <Form form={form} onFinish={handleUpdateLevel} labelCol={{ span: 10 }}>
                    <Form.Item label={t("firstDepositBonusWeekdays")} name="firstDepositBonusWeekdays">
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                    </Form.Item>
                    <Form.Item label={t("firstDepositBonusWeekends")} name="firstDepositBonusWeekends">
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                    </Form.Item>
                    <Form.Item label={t("everyDayBonusWeekday")} name="everyDayBonusWeekday">
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                    </Form.Item>
                    <Form.Item label={t("weekendBonus")} name="weekendBonus">
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                    </Form.Item>
                    <Form.Item label={t("signUpFirstDepositBonus")} name="signUpFirstDepositBonus">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                    </Form.Item>
                    <Form.Item label={t("maximumBonusMoney(1time)")} name="maximumBonusMoney(1time)">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("p")}</span>} />
                    </Form.Item>
                    <Form.Item label={t("maximumBonusMoney(1day)")} name="maximumBonusMoney(1day)">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("p")}</span>} />
                    </Form.Item>
                    <Form.Item label={t("referralBonus")} name="referralBonus">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                    </Form.Item>
                    <Form.Item label={t("depositPlusPriorityApplicationForFirstDepositUponSigningUp")} name="depositPlusPriorityApplicationForFirstDepositUponSigningUp">   
                        <Switch />
                    </Form.Item>
                    <Form.Item label={t("depositPlusPriorityApplicationForEachDeposit")} name="depositPlusPriorityApplicationForEachDeposit">   
                        <Switch />
                    </Form.Item>
                    <Form.Item label={t("rechargeBonusLimitMaximumAmountOfMoneyHeldPoints")} name="rechargeBonusLimitMaximumAmountOfMoneyHeldPoints">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("won")}</span>} />
                    </Form.Item>
                    <Form.Item label={t("sameDayFirstDepositBonusLimit(AfterWithdrawal)")} name="sameDayFirstDepositBonusLimit(AfterWithdrawal)">   
                        <Switch />
                    </Form.Item>
                    <Form.Item label={t("sameDayReplenishmentBonusLimit(AfterWithdrawal)")} name="sameDayReplenishmentBonusLimit(AfterWithdrawal)">   
                        <Switch />
                    </Form.Item>
                    <Form.Item label={t("replenishmentBonusLimit(AfterWithdrawal)")} name="replenishmentBonusLimit(AfterWithdrawal)">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("min")}</span>} />
                    </Form.Item>
                    <Form.Item label={t("sameDayRepleishmentBonus%(afterWithdrawal)")} name="sameDayRepleishmentBonus%(afterWithdrawal)">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                    </Form.Item>
                    <Form.Item label={t("restrictionsApplyAfterWithdrawalOfSurpriseBonus")} name="restrictionsApplyAfterWithdrawalOfSurpriseBonus">   
                        <Switch />
                    </Form.Item>
                    <Form.Item label={t("maximumNumberOfDailySurpriseBonusPayments")} name="maximumNumberOfDailySurpriseBonusPayments">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("times")}</span>} />
                    </Form.Item>
                    <Form.Item label={t("maximumNumberOfSurpriseBonusPaymentsPerTimePeriod")} name="maximumNumberOfSurpriseBonusPaymentsPerTimePeriod">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                    </Form.Item>
                    <Form.Item label={t("changeIndividualGameUsageStatus")} name="changeIndividualGameUsageStatus">   
                        <Switch />
                    </Form.Item>
                    {/* <Form.Item label={t("gameSpecificSettings")} name="gameSpecificSettings">   
                        <Checkbox.Group options={applicabliltyByGameOptions} />
                    </Form.Item> */}
                    {/* Bonus Amount Table */}
                    <Form.Item label={t("bonusAmountSettings")}>
                        <Table
                            dataSource={bonus2AmountData}
                            footer={() => (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center justify-between">
                                        <InputNumber
                                            min={0}
                                            value={newAmount2}
                                            onChange={setNewAmount2}
                                            style={{ width: 70 }}
                                            placeholder="Amount"
                                        />
                                        <span style={{ fontWeight: "bold", width: 45 }} className="justify-center flex">+</span>
                                        <InputNumber
                                            min={0}
                                            value={newBonus2}
                                            onChange={setNewBonus2}
                                            style={{ width: 70 }}
                                            placeholder="Bonus"
                                        />
                                    </div>
                                    <div className="flex w-full justify-center">
                                        <Button type="primary" size="small" onClick={() => handleAddBonus(2, "amount")}>
                                            {t("addition")}
                                        </Button>
                                    </div>
                                </div>
                            )}
                            pagination={false}
                            rowKey="key"
                            showHeader={false}
                            style={{ marginBottom: 16 }}
                            columns={[
                                {
                                    title: "",
                                    dataIndex: "amount",
                                    key: "amount",
                                    width: 70,
                                    render: (value: number) => (
                                        <InputNumber
                                            min={0}
                                            value={value}
                                            style={{ width: 70 }}
                                        />
                                    ),
                                },
                                {
                                    title: "+",
                                    dataIndex: "plus",
                                    key: "plus",
                                    width: 30,
                                    render: () => <span style={{ fontWeight: "bold" }} className="justify-center flex">+</span>,
                                },
                                {
                                    title: "",
                                    dataIndex: "bonus",
                                    key: "bonus",
                                    width: 70,
                                    render: (value: number) => (
                                        <InputNumber
                                            min={0}
                                            value={value}
                                            style={{ width: 70 }}
                                        />
                                    ),
                                },
                                {
                                    title: "",
                                    key: "actions",
                                    render: () => (
                                        <div className="flex justify-center items-center">
                                            <Button type="primary" size="small" style={{ marginRight: 8 }}>{t("change")}</Button>
                                            <Button type="primary" size="small" danger>{t("delete")}</Button>
                                        </div>
                                    ),
                                },
                            ]}
                        />
                    </Form.Item>

                    {/* Bonus Time Table */}
                    <Form.Item label={t("bonusTimeSettings")}>
                        <Table
                            dataSource={bonus2TimeData}
                            pagination={false}
                            rowKey="key"
                            showHeader={false}
                            style={{ marginBottom: 16 }}
                            footer={() => (
                                <div className="flex items-center ">
                                    <div className="flex items-center justify-between">
                                        <Input
                                            value={newTimeFrom2}
                                            onChange={(e) => setNewTimeFrom2(e.target.value)}
                                            style={{ width: 80 }}
                                            placeholder="00:00"
                                        />
                                        <span style={{ fontWeight: "bold", width: 15 }} className="justify-center flex">-</span>
                                        <Input
                                            value={newTimeTo2}
                                            onChange={(e) => setNewTimeTo2(e.target.value)}
                                            style={{ width: 80 }}
                                            placeholder="00:00"
                                        />
                                    </div>
                                    
                                    <Button type="primary" className="ml-4" size="small" onClick={() => handleAddBonus(2, "time")}>
                                        {t("addition")}
                                    </Button>
                                </div>
                            )}
                            columns={[
                                {
                                    title: "",
                                    dataIndex: "from",
                                    key: "from",
                                    width: 80,
                                    render: (value: string) => (
                                        <Input
                                            value={value}
                                            style={{ width: 80 }}
                                            placeholder="00:00"
                                        />
                                    ),
                                },
                                {
                                    title: "",
                                    dataIndex: "to",
                                    key: "to",
                                    width: 80,
                                    render: (value: string) => (
                                        <Input
                                            value={value}
                                            style={{ width: 80 }}
                                            placeholder="00:00"
                                        />
                                    ),
                                },
                                {
                                    title: "",
                                    key: "actions",
                                    width: 160,
                                    render: () => (
                                        <>
                                            <Button type="primary" size="small" style={{ marginRight: 8 }}>{t("change")}</Button>
                                            <Button type="primary" size="small" danger>{t("delete")}</Button>
                                        </>
                                    ),
                                },
                            ]}
                        />
                    </Form.Item>
                </Form>
            </Card>
            
            <Card
                className="max-w-[600px] min-w-[600px]"
                styles={{ header: { backgroundColor: 'black', color: 'white' } }}
                title={t("chargeBonus3Setting")}
                actions={[
                <Button 
                    type="default" 
                    onClick={() => {
                        if (selectedLevel) {
                            form.submit();
                        }
                    }}
                    disabled={!selectedLevel || saving}
                    loading={saving}
                >{t("change")}</Button>,
                // <Button type="default" onClick={handleApplyToAllLevels}>{t("applyToAllLevelsAtOnce")}</Button>
            ]}
            >
                <Form form={form} onFinish={handleUpdateLevel} labelCol={{ span: 10 }}>
                    <Form.Item label={t("firstDepositBonusWeekdays")} name="firstDepositBonusWeekdays">
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                    </Form.Item>
                    <Form.Item label={t("firstDepositBonusWeekends")} name="firstDepositBonusWeekends">
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                    </Form.Item>
                    <Form.Item label={t("everyDayBonusWeekday")} name="everyDayBonusWeekday">
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                    </Form.Item>
                    <Form.Item label={t("weekendBonus")} name="weekendBonus">
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                    </Form.Item>
                    <Form.Item label={t("signUpFirstDepositBonus")} name="signUpFirstDepositBonus">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                    </Form.Item>
                    <Form.Item label={t("maximumBonusMoney(1time)")} name="maximumBonusMoney(1time)">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("p")}</span>} />
                    </Form.Item>
                    <Form.Item label={t("maximumBonusMoney(1day)")} name="maximumBonusMoney(1day)">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("p")}</span>} />
                    </Form.Item>
                    <Form.Item label={t("referralBonus")} name="referralBonus">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                    </Form.Item>
                    <Form.Item label={t("depositPlusPriorityApplicationForFirstDepositUponSigningUp")} name="depositPlusPriorityApplicationForFirstDepositUponSigningUp">   
                        <Switch />
                    </Form.Item>
                    <Form.Item label={t("depositPlusPriorityApplicationForEachDeposit")} name="depositPlusPriorityApplicationForEachDeposit">   
                        <Switch />
                    </Form.Item>
                    <Form.Item label={t("rechargeBonusLimitMaximumAmountOfMoneyHeldPoints")} name="rechargeBonusLimitMaximumAmountOfMoneyHeldPoints">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("won")}</span>} />
                    </Form.Item>
                    <Form.Item label={t("sameDayFirstDepositBonusLimit(AfterWithdrawal)")} name="sameDayFirstDepositBonusLimit(AfterWithdrawal)">   
                        <Switch />
                    </Form.Item>
                    <Form.Item label={t("sameDayReplenishmentBonusLimit(AfterWithdrawal)")} name="sameDayReplenishmentBonusLimit(AfterWithdrawal)">   
                        <Switch />
                    </Form.Item>
                    <Form.Item label={t("replenishmentBonusLimit(AfterWithdrawal)")} name="replenishmentBonusLimit(AfterWithdrawal)">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("min")}</span>} />
                    </Form.Item>
                    <Form.Item label={t("sameDayRepleishmentBonus%(afterWithdrawal)")} name="sameDayRepleishmentBonus%(afterWithdrawal)">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                    </Form.Item>
                    <Form.Item label={t("restrictionsApplyAfterWithdrawalOfSurpriseBonus")} name="restrictionsApplyAfterWithdrawalOfSurpriseBonus">   
                        <Switch />
                    </Form.Item>
                    <Form.Item label={t("maximumNumberOfDailySurpriseBonusPayments")} name="maximumNumberOfDailySurpriseBonusPayments">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("times")}</span>} />
                    </Form.Item>
                    <Form.Item label={t("maximumNumberOfSurpriseBonusPaymentsPerTimePeriod")} name="maximumNumberOfSurpriseBonusPaymentsPerTimePeriod">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                    </Form.Item>
                    <Form.Item label={t("changeIndividualGameUsageStatus")} name="changeIndividualGameUsageStatus">   
                        <Switch />
                    </Form.Item>
                    {/* <Form.Item label={t("gameSpecificSettings")} name="gameSpecificSettings">   
                        <Checkbox.Group options={applicabliltyByGameOptions} />
                    </Form.Item> */}
                    {/* Bonus Amount Table */}
                    <Form.Item label={t("bonusAmountSettings")}>
                        <Table
                            dataSource={bonus3AmountData}
                            footer={() => (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center justify-between">
                                        <InputNumber
                                            min={0}
                                            value={newAmount3}
                                            onChange={setNewAmount3}
                                            style={{ width: 70 }}
                                            placeholder="Amount"
                                        />
                                        <span style={{ fontWeight: "bold", width: 45 }} className="justify-center flex">+</span>
                                        <InputNumber
                                            min={0}
                                            value={newBonus3}
                                            onChange={setNewBonus3}
                                            style={{ width: 70 }}
                                            placeholder="Bonus"
                                        />
                                    </div>
                                    <div className="flex w-full justify-center">
                                        <Button type="primary" size="small" onClick={() => handleAddBonus(3, "amount")}>
                                            {t("addition")}
                                        </Button>
                                    </div>
                                </div>
                            )}
                            pagination={false}
                            rowKey="key"
                            showHeader={false}
                            style={{ marginBottom: 16 }}
                            columns={[
                                {
                                    title: "",
                                    dataIndex: "amount",
                                    key: "amount",
                                    width: 70,
                                    render: (value: number) => (
                                        <InputNumber
                                            min={0}
                                            value={value}
                                            style={{ width: 70 }}
                                        />
                                    ),
                                },
                                {
                                    title: "+",
                                    dataIndex: "plus",
                                    key: "plus",
                                    width: 30,
                                    render: () => <span style={{ fontWeight: "bold" }} className="justify-center flex">+</span>,
                                },
                                {
                                    title: "",
                                    dataIndex: "bonus",
                                    key: "bonus",
                                    width: 70,
                                    render: (value: number) => (
                                        <InputNumber
                                            min={0}
                                            value={value}
                                            style={{ width: 70 }}
                                        />
                                    ),
                                },
                                {
                                    title: "",
                                    key: "actions",
                                    render: () => (
                                        <div className="flex justify-center items-center">
                                            <Button type="primary" size="small" style={{ marginRight: 8 }}>{t("change")}</Button>
                                            <Button type="primary" size="small" danger>{t("delete")}</Button>
                                        </div>
                                    ),
                                },
                            ]}
                        />
                    </Form.Item>

                    {/* Bonus Time Table */}
                    <Form.Item label={t("bonusTimeSettings")}>
                        <Table
                            dataSource={bonus3TimeData}
                            pagination={false}
                            rowKey="key"
                            showHeader={false}
                            style={{ marginBottom: 16 }}
                            footer={() => (
                                <div className="flex items-center ">
                                    <div className="flex items-center justify-between">
                                        <Input
                                            value={newTimeFrom3}
                                            onChange={(e) => setNewTimeFrom3(e.target.value)}
                                            style={{ width: 80 }}
                                            placeholder="00:00"
                                        />
                                        <span style={{ fontWeight: "bold", width: 15 }} className="justify-center flex">-</span>
                                        <Input
                                            value={newTimeTo3}
                                            onChange={(e) => setNewTimeTo3(e.target.value)}
                                            style={{ width: 80 }}
                                            placeholder="00:00"
                                        />
                                    </div>
                                    
                                    <Button type="primary" className="ml-4" size="small" onClick={() => handleAddBonus(3, "time")}>
                                        {t("addition")}
                                    </Button>
                                </div>
                            )}
                            columns={[
                                {
                                    title: "",
                                    dataIndex: "from",
                                    key: "from",
                                    width: 80,
                                    render: (value: string) => (
                                        <Input
                                            value={value}
                                            style={{ width: 80 }}
                                            placeholder="00:00"
                                        />
                                    ),
                                },
                                {
                                    title: "",
                                    dataIndex: "to",
                                    key: "to",
                                    width: 80,
                                    render: (value: string) => (
                                        <Input
                                            value={value}
                                            style={{ width: 80 }}
                                            placeholder="00:00"
                                        />
                                    ),
                                },
                                {
                                    title: "",
                                    key: "actions",
                                    width: 160,
                                    render: () => (
                                        <>
                                            <Button type="primary" size="small" style={{ marginRight: 8 }}>{t("change")}</Button>
                                            <Button type="primary" size="small" danger>{t("delete")}</Button>
                                        </>
                                    ),
                                },
                            ]}
                        />
                    </Form.Item>
                </Form>
            </Card>

            <Card
                className="max-w-[600px] min-w-[600px]"
                styles={{ header: { backgroundColor: 'black', color: 'white' } }}
                title={t("chargeBonus4Setting")}
                actions={[
                <Button 
                    type="default" 
                    onClick={() => {
                        if (selectedLevel) {
                            form.submit();
                        }
                    }}
                    disabled={!selectedLevel || saving}
                    loading={saving}
                >{t("change")}</Button>,
                // <Button type="default" onClick={handleApplyToAllLevels}>{t("applyToAllLevelsAtOnce")}</Button>
            ]}
            >
                <Form form={form} onFinish={handleUpdateLevel} labelCol={{ span: 10 }}>
                    <Form.Item label={t("firstDepositBonusWeekdays")} name="firstDepositBonusWeekdays">
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                    </Form.Item>
                    <Form.Item label={t("firstDepositBonusWeekends")} name="firstDepositBonusWeekends">
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                    </Form.Item>
                    <Form.Item label={t("everyDayBonusWeekday")} name="everyDayBonusWeekday">
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                    </Form.Item>
                    <Form.Item label={t("weekendBonus")} name="weekendBonus">
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                    </Form.Item>
                    <Form.Item label={t("signUpFirstDepositBonus")} name="signUpFirstDepositBonus">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                    </Form.Item>
                    <Form.Item label={t("maximumBonusMoney(1time)")} name="maximumBonusMoney(1time)">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("p")}</span>} />
                    </Form.Item>
                    <Form.Item label={t("maximumBonusMoney(1day)")} name="maximumBonusMoney(1day)">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("p")}</span>} />
                    </Form.Item>
                    <Form.Item label={t("referralBonus")} name="referralBonus">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                    </Form.Item>
                    <Form.Item label={t("depositPlusPriorityApplicationForFirstDepositUponSigningUp")} name="depositPlusPriorityApplicationForFirstDepositUponSigningUp">   
                        <Switch />
                    </Form.Item>
                    <Form.Item label={t("depositPlusPriorityApplicationForEachDeposit")} name="depositPlusPriorityApplicationForEachDeposit">   
                        <Switch />
                    </Form.Item>
                    <Form.Item label={t("rechargeBonusLimitMaximumAmountOfMoneyHeldPoints")} name="rechargeBonusLimitMaximumAmountOfMoneyHeldPoints">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("won")}</span>} />
                    </Form.Item>
                    <Form.Item label={t("sameDayFirstDepositBonusLimit(AfterWithdrawal)")} name="sameDayFirstDepositBonusLimit(AfterWithdrawal)">   
                        <Switch />
                    </Form.Item>
                    <Form.Item label={t("sameDayReplenishmentBonusLimit(AfterWithdrawal)")} name="sameDayReplenishmentBonusLimit(AfterWithdrawal)">   
                        <Switch />
                    </Form.Item>
                    <Form.Item label={t("replenishmentBonusLimit(AfterWithdrawal)")} name="replenishmentBonusLimit(AfterWithdrawal)">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("min")}</span>} />
                    </Form.Item>
                    <Form.Item label={t("sameDayRepleishmentBonus%(afterWithdrawal)")} name="sameDayRepleishmentBonus%(afterWithdrawal)">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                    </Form.Item>
                    <Form.Item label={t("restrictionsApplyAfterWithdrawalOfSurpriseBonus")} name="restrictionsApplyAfterWithdrawalOfSurpriseBonus">   
                        <Switch />
                    </Form.Item>
                    <Form.Item label={t("maximumNumberOfDailySurpriseBonusPayments")} name="maximumNumberOfDailySurpriseBonusPayments">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("times")}</span>} />
                    </Form.Item>
                    <Form.Item label={t("maximumNumberOfSurpriseBonusPaymentsPerTimePeriod")} name="maximumNumberOfSurpriseBonusPaymentsPerTimePeriod">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                    </Form.Item>
                    <Form.Item label={t("changeIndividualGameUsageStatus")} name="changeIndividualGameUsageStatus">   
                        <Switch />
                    </Form.Item>
                    {/* <Form.Item label={t("gameSpecificSettings")} name="gameSpecificSettings">   
                        <Checkbox.Group options={applicabliltyByGameOptions} />
                    </Form.Item> */}
                    {/* Bonus Amount Table */}
                    <Form.Item label={t("bonusAmountSettings")}>
                        <Table
                            dataSource={bonus4AmountData}
                            footer={() => (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center justify-between">
                                        <InputNumber
                                            min={0}
                                            value={newAmount4}
                                            onChange={setNewAmount4}
                                            style={{ width: 70 }}
                                            placeholder="Amount"
                                        />
                                        <span style={{ fontWeight: "bold", width: 45 }} className="justify-center flex">+</span>
                                        <InputNumber
                                            min={0}
                                            value={newBonus4}
                                            onChange={setNewBonus4}
                                            style={{ width: 70 }}
                                            placeholder="Bonus"
                                        />
                                    </div>
                                    <div className="flex w-full justify-center">
                                        <Button type="primary" size="small" onClick={() => handleAddBonus(4, "amount")}>
                                            {t("addition")}
                                        </Button>
                                    </div>
                                </div>
                            )}
                            pagination={false}
                            rowKey="key"
                            showHeader={false}
                            style={{ marginBottom: 16 }}
                            columns={[
                                {
                                    title: "",
                                    dataIndex: "amount",
                                    key: "amount",
                                    width: 70,
                                    render: (value: number) => (
                                        <InputNumber
                                            min={0}
                                            value={value}
                                            style={{ width: 70 }}
                                        />
                                    ),
                                },
                                {
                                    title: "+",
                                    dataIndex: "plus",
                                    key: "plus",
                                    width: 30,
                                    render: () => <span style={{ fontWeight: "bold" }} className="justify-center flex">+</span>,
                                },
                                {
                                    title: "",
                                    dataIndex: "bonus",
                                    key: "bonus",
                                    width: 70,
                                    render: (value: number) => (
                                        <InputNumber
                                            min={0}
                                            value={value}
                                            style={{ width: 70 }}
                                        />
                                    ),
                                },
                                {
                                    title: "",
                                    key: "actions",
                                    render: () => (
                                        <div className="flex justify-center items-center">
                                            <Button type="primary" size="small" style={{ marginRight: 8 }}>{t("change")}</Button>
                                            <Button type="primary" size="small" danger>{t("delete")}</Button>
                                        </div>
                                    ),
                                },
                            ]}
                        />
                    </Form.Item>

                    {/* Bonus Time Table */}
                    <Form.Item label={t("bonusTimeSettings")}>
                        <Table
                            dataSource={bonus4TimeData}
                            pagination={false}
                            rowKey="key"
                            showHeader={false}
                            style={{ marginBottom: 16 }}
                            footer={() => (
                                <div className="flex items-center ">
                                    <div className="flex items-center justify-between">
                                        <Input
                                            value={newTimeFrom4}
                                            onChange={(e) => setNewTimeFrom4(e.target.value)}
                                            style={{ width: 80 }}
                                            placeholder="00:00"
                                        />
                                        <span style={{ fontWeight: "bold", width: 15 }} className="justify-center flex">-</span>
                                        <Input
                                            value={newTimeTo4}
                                            onChange={(e) => setNewTimeTo4(e.target.value)}
                                            style={{ width: 80 }}
                                            placeholder="00:00"
                                        />
                                    </div>
                                    
                                    <Button type="primary" className="ml-4" size="small" onClick={() => handleAddBonus(4, "time")}>
                                        {t("addition")}
                                    </Button>
                                </div>
                            )}
                            columns={[
                                {
                                    title: "",
                                    dataIndex: "from",
                                    key: "from",
                                    width: 80,
                                    render: (value: string) => (
                                        <Input
                                            value={value}
                                            style={{ width: 80 }}
                                            placeholder="00:00"
                                        />
                                    ),
                                },
                                {
                                    title: "",
                                    dataIndex: "to",
                                    key: "to",
                                    width: 80,
                                    render: (value: string) => (
                                        <Input
                                            value={value}
                                            style={{ width: 80 }}
                                            placeholder="00:00"
                                        />
                                    ),
                                },
                                {
                                    title: "",
                                    key: "actions",
                                    width: 160,
                                    render: () => (
                                        <>
                                            <Button type="primary" size="small" style={{ marginRight: 8 }}>{t("change")}</Button>
                                            <Button type="primary" size="small" danger>{t("delete")}</Button>
                                        </>
                                    ),
                                },
                            ]}
                        />
                    </Form.Item>
                </Form>
            </Card>

            <Card
                className="max-w-[600px] min-w-[600px]"
                styles={{ header: { backgroundColor: 'black', color: 'white' } }}
                title={t("chargeBonus5Setting")}
                actions={[
                    <Button 
                        type="default" 
                        onClick={() => {
                            if (selectedLevel) {
                                form.submit();
                            }
                        }}
                        disabled={!selectedLevel || saving}
                        loading={saving}
                    >{t("change")}</Button>,
                    // <Button type="default" onClick={() => {}}>{t("applyToAllLevelsAtOnce")}</Button>
                ]}
            >
                <Form form={form} onFinish={handleUpdateLevel} labelCol={{ span: 10 }}>
                    <Form.Item label={t("firstDepositBonusWeekdays")} name="firstDepositBonusWeekdays">
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                    </Form.Item>
                    <Form.Item label={t("firstDepositBonusWeekends")} name="firstDepositBonusWeekends">
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                    </Form.Item>
                    <Form.Item label={t("everyDayBonusWeekday")} name="everyDayBonusWeekday">
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                    </Form.Item>
                    <Form.Item label={t("weekendBonus")} name="weekendBonus">
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                    </Form.Item>
                    <Form.Item label={t("signUpFirstDepositBonus")} name="signUpFirstDepositBonus">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                    </Form.Item>
                    <Form.Item label={t("maximumBonusMoney(1time)")} name="maximumBonusMoney(1time)">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("p")}</span>} />
                    </Form.Item>
                    <Form.Item label={t("maximumBonusMoney(1day)")} name="maximumBonusMoney(1day)">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("p")}</span>} />
                    </Form.Item>
                    <Form.Item label={t("referralBonus")} name="referralBonus">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                    </Form.Item>
                    <Form.Item label={t("depositPlusPriorityApplicationForFirstDepositUponSigningUp")} name="depositPlusPriorityApplicationForFirstDepositUponSigningUp">   
                        <Switch />
                    </Form.Item>
                    <Form.Item label={t("depositPlusPriorityApplicationForEachDeposit")} name="depositPlusPriorityApplicationForEachDeposit">   
                        <Switch />
                    </Form.Item>
                    <Form.Item label={t("rechargeBonusLimitMaximumAmountOfMoneyHeldPoints")} name="rechargeBonusLimitMaximumAmountOfMoneyHeldPoints">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("won")}</span>} />
                    </Form.Item>
                    <Form.Item label={t("sameDayFirstDepositBonusLimit(AfterWithdrawal)")} name="sameDayFirstDepositBonusLimit(AfterWithdrawal)">   
                        <Switch />
                    </Form.Item>
                    <Form.Item label={t("sameDayReplenishmentBonusLimit(AfterWithdrawal)")} name="sameDayReplenishmentBonusLimit(AfterWithdrawal)">   
                        <Switch />
                    </Form.Item>
                    <Form.Item label={t("replenishmentBonusLimit(AfterWithdrawal)")} name="replenishmentBonusLimit(AfterWithdrawal)">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("min")}</span>} />
                    </Form.Item>
                    <Form.Item label={t("sameDayRepleishmentBonus%(afterWithdrawal)")} name="sameDayRepleishmentBonus%(afterWithdrawal)">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                    </Form.Item>
                    <Form.Item label={t("restrictionsApplyAfterWithdrawalOfSurpriseBonus")} name="restrictionsApplyAfterWithdrawalOfSurpriseBonus">   
                        <Switch />
                    </Form.Item>
                    <Form.Item label={t("maximumNumberOfDailySurpriseBonusPayments")} name="maximumNumberOfDailySurpriseBonusPayments">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>{t("times")}</span>} />
                    </Form.Item>
                    <Form.Item label={t("maximumNumberOfSurpriseBonusPaymentsPerTimePeriod")} name="maximumNumberOfSurpriseBonusPaymentsPerTimePeriod">   
                        <InputNumber min={0} addonAfter={<span style={{ display: 'inline-block', width: '40px', textAlign: 'center' }}>%</span>} />
                    </Form.Item>
                    <Form.Item label={t("changeIndividualGameUsageStatus")} name="changeIndividualGameUsageStatus">   
                        <Switch />
                    </Form.Item>
                    {/* <Form.Item label={t("gameSpecificSettings")} name="gameSpecificSettings">   
                        <Checkbox.Group options={applicabliltyByGameOptions} />
                    </Form.Item> */}
                    {/* Bonus Amount Table */}
                    <Form.Item label={t("bonusAmountSettings")}>
                        <Table
                            dataSource={bonus5AmountData}
                            footer={() => (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center justify-between">
                                        <InputNumber
                                            min={0}
                                            value={newAmount5}
                                            onChange={setNewAmount5}
                                            style={{ width: 70 }}
                                            placeholder="Amount"
                                        />
                                        <span style={{ fontWeight: "bold", width: 45 }} className="justify-center flex">+</span>
                                        <InputNumber
                                            min={0}
                                            value={newBonus5}
                                            onChange={setNewBonus5}
                                            style={{ width: 70 }}
                                            placeholder="Bonus"
                                        />
                                    </div>
                                    <div className="flex w-full justify-center">
                                        <Button type="primary" size="small" onClick={() => handleAddBonus(5, "amount")}>
                                            {t("addition")}
                                        </Button>
                                    </div>
                                </div>
                            )}
                            pagination={false}
                            rowKey="key"
                            showHeader={false}
                            style={{ marginBottom: 16 }}
                            columns={[
                                {
                                    title: "",
                                    dataIndex: "amount",
                                    key: "amount",
                                    width: 70,
                                    render: (value: number) => (
                                        <InputNumber
                                            min={0}
                                            value={value}
                                            style={{ width: 70 }}
                                        />
                                    ),
                                },
                                {
                                    title: "+",
                                    dataIndex: "plus",
                                    key: "plus",
                                    width: 30,
                                    render: () => <span style={{ fontWeight: "bold" }} className="justify-center flex">+</span>,
                                },
                                {
                                    title: "",
                                    dataIndex: "bonus",
                                    key: "bonus",
                                    width: 70,
                                    render: (value: number) => (
                                        <InputNumber
                                            min={0}
                                            value={value}
                                            style={{ width: 70 }}
                                        />
                                    ),
                                },
                                {
                                    title: "",
                                    key: "actions",
                                    render: () => (
                                        <div className="flex justify-center items-center">
                                            <Button type="primary" size="small" style={{ marginRight: 8 }}>{t("change")}</Button>
                                            <Button type="primary" size="small" danger>{t("delete")}</Button>
                                        </div>
                                    ),
                                },
                            ]}
                        />
                    </Form.Item>

                    {/* Bonus Time Table */}
                    <Form.Item label={t("bonusTimeSettings")}>
                        <Table
                            dataSource={bonus5TimeData}
                            pagination={false}
                            rowKey="key"
                            showHeader={false}
                            style={{ marginBottom: 16 }}
                            footer={() => (
                                <div className="flex items-center ">
                                    <div className="flex items-center justify-between">
                                        <Input
                                            value={newTimeFrom5}
                                            onChange={(e) => setNewTimeFrom5(e.target.value)}
                                            style={{ width: 80 }}
                                            placeholder="00:00"
                                        />
                                        <span style={{ fontWeight: "bold", width: 15 }} className="justify-center flex">-</span>
                                        <Input
                                            value={newTimeTo5}
                                            onChange={(e) => setNewTimeTo5(e.target.value)}
                                            style={{ width: 80 }}
                                            placeholder="00:00"
                                        />
                                    </div>
                                    
                                    <Button type="primary" className="ml-4" size="small" onClick={() => handleAddBonus(5, "time")}>
                                        {t("addition")}
                                    </Button>
                                </div>
                            )}
                            columns={[
                                {
                                    title: "",
                                    dataIndex: "from",
                                    key: "from",
                                    width: 80,
                                    render: (value: string) => (
                                        <Input
                                            value={value}
                                            style={{ width: 80 }}
                                            placeholder="00:00"
                                        />
                                    ),
                                },
                                {
                                    title: "",
                                    dataIndex: "to",
                                    key: "to",
                                    width: 80,
                                    render: (value: string) => (
                                        <Input
                                            value={value}
                                            style={{ width: 80 }}
                                            placeholder="00:00"
                                        />
                                    ),
                                },
                                {
                                    title: "",
                                    key: "actions",
                                    width: 160,
                                    render: () => (
                                        <>
                                            <Button type="primary" size="small" style={{ marginRight: 8 }}>{t("change")}</Button>
                                            <Button type="primary" size="small" danger>{t("delete")}</Button>
                                        </>
                                    ),
                                },
                            ]}
                        />
                    </Form.Item>
                </Form>
            </Card>
        </div>

        {/* Modal for Surprise Bonus and Charging Bonus */}
        <Modal
            title={modalType === 'surpriseBonus' ? t("surpriseBonusSettings") : t("chargingBonusSettings")}
            open={modalVisible}
            onCancel={() => {
                setModalVisible(false);
                setModalType(null);
            }}
            footer={null}
            width={800}
        >
            {modalType === 'surpriseBonus' && (
                <div>
                    <Form 
                        form={surpriseBonusForm}
                        layout="vertical"
                        onFinish={editingSurpriseBonus ? handleUpdateSurpriseBonus : handleCreateSurpriseBonus}
                    >
                        <Form.Item 
                            label={t("timeInterval")} 
                            name="timeInterval"
                            rules={[{ required: true, message: 'Please enter time interval' }]}
                        >
                            <Input placeholder="00:00 - 23:59" />
                        </Form.Item>
                        <Form.Item 
                            label={t("surpriseBonus%")} 
                            name="bonusPercent"
                            rules={[{ required: true, message: 'Please enter bonus percentage' }]}
                        >
                            <InputNumber min={0} max={100} addonAfter="%" />
                        </Form.Item>
                        <Form.Item 
                            label={t("paymentStatus")} 
                            name="paymentStatus"
                            rules={[{ required: true, message: 'Please select payment status' }]}
                        >
                            <Select>
                                <Select.Option value="paid">{t("paid")}</Select.Option>
                                <Select.Option value="unpaid">{t("unpaid")}</Select.Option>
                            </Select>
                        </Form.Item>
                        <div className="flex justify-end gap-2 mt-4">
                            <Button onClick={() => {
                                setModalVisible(false);
                                setEditingSurpriseBonus(null);
                                surpriseBonusForm.resetFields();
                            }}>
                                {t("cancel")}
                            </Button>
                            <Button type="primary" htmlType="submit" loading={saving}>
                                {editingSurpriseBonus ? t("update") : t("create")}
                            </Button>
                        </div>
                    </Form>
                </div>
            )}
            
            {modalType === 'chargingBonus' && (
                <div>
                    <Form layout="vertical">
                        <Form.Item label={t("member")}>
                            <Input placeholder={t("memberName")} />
                        </Form.Item>
                        <Form.Item label={t("bonusPaymentMethod")}>
                            <Select>
                                {bonusPaymentMethodOptions.map(option => (
                                    <Select.Option key={option.value} value={option.value}>
                                        {option.label}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <div className="flex justify-end gap-2 mt-4">
                            <Button onClick={() => setModalVisible(false)}>
                                {t("cancel")}
                            </Button>
                            <Button type="primary">
                                {t("save")}
                            </Button>
                        </div>
                    </Form>
                </div>
            )}
        </Modal>
  </Card>;
}