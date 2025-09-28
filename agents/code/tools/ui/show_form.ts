import { tool } from '@langchain/core/tools';
import { interrupt } from '@langchain/langgraph';
import { z } from 'zod';

const comprehensiveSchema = {
    type: 'object',
    title: '用户信息登记表单',
    description: '请完整填写以下信息，带 * 为必填项',
    required: ['fullName', 'email', 'password', 'agreeToTerms', 'education'],
    properties: {
        fullName: {
            type: 'string',
            title: '姓名',
            description: '请输入真实姓名',
            minLength: 2,
            maxLength: 20,
            pattern: '^[\\u4e00-\\u9fa5a-zA-Z]+$',
        },
        email: {
            type: 'string',
            title: '邮箱',
            format: 'email',
            description: '用于接收通知，示例：xxx@xxx.com',
        },
        password: {
            type: 'string',
            title: '密码',
            minLength: 8,
            pattern: '^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[!@#$%^&*])[A-Za-z\\d!@#$%^&*]{8,}$',
            description: '需包含大小写字母、数字及特殊符号（!@#$%^&*），至少 8 位',
        },
        age: {
            type: 'number',
            title: '年龄',
            minimum: 18,
            maximum: 120,
            multipleOf: 1,
            description: '仅支持 18-120 之间的整数',
        },
        agreeToTerms: {
            type: 'boolean',
            title: '我已阅读并同意《用户服务协议》和《隐私政策》',
            default: false,
        },
        education: {
            type: 'string',
            title: '学历',
            enum: ['primary', 'junior', 'senior', 'college', 'undergraduate', 'postgraduate'],
            enumNames: ['小学', '初中', '高中', '专科', '本科', '研究生'],
            default: 'undergraduate',
        },
        hobbies: {
            type: 'array',
            title: '兴趣爱好',
            items: {
                type: 'string',
                enum: ['reading', 'sports', 'music', 'coding', 'travel'],
                enumNames: ['阅读', '运动', '音乐', '编程', '旅行'],
            },
            minItems: 1,
            maxItems: 3,
            uniqueItems: true,
            description: '最多选择 3 项兴趣爱好',
        },
        address: {
            type: 'object',
            title: '联系地址',
            required: ['province', 'city'],
            properties: {
                province: {
                    type: 'string',
                    title: '省份',
                    minLength: 2,
                },
                city: {
                    type: 'string',
                    title: '城市',
                    minLength: 2,
                },
                detail: {
                    type: 'string',
                    title: '详细地址',
                    minLength: 5,
                },
            },
        },
        birthday: {
            type: 'string',
            format: 'date',
            title: '生日',
            description: '请选择出生日期',
        },
        intro: {
            type: 'string',
            title: '个人简介',
            minLength: 10,
            maxLength: 500,
            description: '简要介绍自己，10-500 字',
        },
    },
};

export const show_form = tool(
    async ({ schema }) => {
        const response = interrupt('Please fill in the form');
        return response;
    },
    {
        name: 'show_form',
        description: `展示一个表单到用户的终端，工具将会等待用户填写数据，返回的数据是用户所填写的数据。

schema 字段应为 react-jsonschema-form (RJSF) 的 JSON Schema 格式。你需要提供一个对象，描述表单的字段、类型、标题、校验等信息。

基本结构如下：
    ${JSON.stringify(comprehensiveSchema, null, 2)}
进阶用法：
- enumNames 可自定义下拉选项的显示文本。
- dependencies 可实现字段间的依赖与联动。
- oneOf/anyOf 可实现多选一或多种结构。
- pattern 可对字符串字段进行正则校验。
`,
        schema: z.object({
            schema: z.any().describe(`表单的 schema`),
        }),
    },
);
