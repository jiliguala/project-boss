/**
 * 异步选择组件
 */
import React, {Component} from 'react';
import PropTypes from 'prop-types';

import { Spin, message, Select } from 'antd';
const Option = Select.Option;

import { fetch } from '../../common/api';
import { log } from '../../common/tool';

//封装组件
class AjaxSelect extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            listData: []
        };
        this.handleChange = this.handleChange.bind(this);
        // 是否已加载
        this.open = true;
    }
    componentDidMount() {
        this.handleGetList();
    }
    componentWillUnmount() {
        this.open = false;
    }
    render() {
        const {listData, loading} = this.state;
        const {value, listName, listValueKey, listNameKey, disabled} = this.props;
        let selectValue;
        if(Array.isArray(value)) {
            selectValue = value[0];
        }else {
            selectValue = value;
        }
        return (
            <Spin spinning={loading} className="app-ajax-select">
                <Select
                    showSearch
                    optionFilterProp="children"
                    value={selectValue}
                    onChange={this.handleChange}
                    placeholder={'选择' + listName}
                    notFoundContent={'未找到' + listName}
                    allowClear
                    disabled={disabled}
                >
                    <Option value="" title={'选择' + listName}>选择{listName}</Option>
                    {listData.map((item, index) => <Option key={index} value={item[listValueKey].toString()} title={item[listNameKey]}>{item[listNameKey]}</Option>)}
                </Select>
            </Spin>
        );
    }
    handleGetList() {
        const {apiName, apiData, apiMethod, listName} = this.props;
        this.setState({
            loading: true
        });
        fetch(apiName, apiData, apiMethod)
            .then((data) => {
                // 判断如果卸载,则不再设置数据
                if(!this.open) return;
                this.setState({
                    loading: false,
                    listData: data.data
                });
            })
            .catch(function(err) {
                log.error(err);
                message.error('获取' + listName + '失败:' + err.message);
            });
    }
    handleChange(key) {
        const {value, listValueKey, listNameKey, onChange} = this.props;
        const {listData} = this.state;
        if(Array.isArray(value)) {
            if(!key) return onChange(['', '']);
            let label;
            listData.some(function(item) {
                if(item[listValueKey].toString() === key) {
                    label = item[listNameKey];
                    return true;
                }
                else return false;
            });
            onChange([key, label]);
        }else {
            onChange(key || '');
        }
    }
}

AjaxSelect.propTypes = {
    apiName: PropTypes.string.isRequired, // API请求名,由于直接诶读取data.data的数组数据,所以该API不能使用分页
    apiData: PropTypes.object, // api请求附加的数据
    apiMethod: PropTypes.string, // api请求method
    listName: PropTypes.string.isRequired, // 缺省列表名称
    listValueKey: PropTypes.string.isRequired, // 列表值的key值
    listNameKey: PropTypes.string.isRequired, // 列表名称key值
    value: PropTypes.oneOfType([ // 值,支持字符串和数组形式
        PropTypes.string, // key值
        PropTypes.array, // [key, label]形式
    ]),
    onChange: PropTypes.func, // 获取值变化函数
    disabled: PropTypes.bool
};

export default AjaxSelect;