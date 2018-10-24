/**
 * 选择顾问
 */
import React, {Component} from 'react';
import PropTypes from 'prop-types';

import { TreeSelect, Spin, message, Select, Row, Col } from 'antd';
const Option = Select.Option;

import { fetch } from '../../common/api';
import { log } from '../../common/tool';

function buildGroupChildData(child) {
    if(!child || Array.isArray(child)) return [];
    return Object.keys(child).map(function(groupId) {
        const group = child[groupId];
        return {
            title: group.name,
            value: group.group_id,
            key: group.group_id,
            children: buildGroupChildData(group.child)
        };
    });
}

//封装组件
class ManagerSelect extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            managerGroupData: [],
            managerData: []
        };
        this.handleChangeGroup = this.handleChangeGroup.bind(this);
        this.handleChangeManager = this.handleChangeManager.bind(this);
        // 是否已加载
        this.open = true;
    }
    componentDidMount() {
        const {value} = this.props;
        this.handleGetGroupList();
        if(value[0]) {
            this.handleGetManagerList(value[0]);
        }
    }
    componentDidUpdate(prevProps) {
        const {value} = prevProps;
        // 查询是否有变更组
        const newValue = this.props.value || [];
        if(value && (newValue[0] !== value[0])) {
            this.handleGetManagerList(newValue[0]);
        }
    }
    componentWillUnmount() {
        this.open = false;
    }
    render() {
        const {managerGroupData, managerData, loading} = this.state;
        const {value, disabled} = this.props;
        return (
            <Spin spinning={loading} className="app-manager-select">
                <Row>
                    <Col span={12} className="p-r">
                        <TreeSelect
                            showSearch
                            value={value ? value[0] : ''}
                            dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                            treeData={managerGroupData}
                            placeholder="选择用户组"
                            onChange={this.handleChangeGroup}
                            treeNodeFilterProp="title"
                            notFoundContent="未找到数据"
                            allowClear
                            disabled={disabled}
                        />
                    </Col>
                    <Col span={12}>
                        <Select
                            showSearch
                            optionFilterProp="children"
                            value={value ? value[1] : ''}
                            onChange={this.handleChangeManager}
                            placeholder="选择用户"
                            notFoundContent="未找到用户"
                            allowClear
                            disabled={disabled}
                        >
                            <Option value="">选择用户</Option>
                            {managerData.map((item) => <Option key={item.user_id} value={item.user_id}>{item.name}</Option>)}
                        </Select>
                    </Col>
                </Row>
            </Spin>
        );
    }
    handleGetGroupList() {
        const { groupId } = this.props;
        this.setState({
            loading: true
        });
        fetch('manager-group', {
            isjs: 1,
            group_id: groupId || 179,
            isleave: 1
        }, 'jsonp', {
            timeout: 60 * 1000
        })
            .then((data) => {
                if(data.state !== 1) return message.error(data.msg);
                let managerGroupData = data.data.map(function(group) {
                    return {
                        title: group.name,
                        value: group.group_id,
                        key: group.group_id,
                        children: buildGroupChildData(group.child)
                    };
                });
                managerGroupData.unshift({
                    title: '选择用户组',
                    value: '',
                    key: 'all',
                });
                // 判断如果卸载,则不再设置数据
                if(!this.open) return;
                this.setState({
                    loading: false,
                    managerGroupData
                });
            })
            .catch((err) => {
                if(!this.open) return;
                this.setState({
                    loading: false
                });
                log.error(err);
                message.error('获取用户组失败:' + err.message);
            });
    }
    handleGetManagerList(groupId) {
        if(!groupId) {
            this.setState({
                loading: false,
                managerData: []
            });
            return;
        }
        this.setState({
            loading: true,
            managerData: []
        });
        fetch('manager', {
            group_id: groupId
        }, 'jsonp', {
            timeout: 60 * 1000
        })
            .then((data) => {
                if(data.state !== 1) return message.error(data.msg);
                // 判断如果卸载,则不再设置数据
                if(!this.open) return;
                this.setState({
                    loading: false,
                    managerData: data.data
                });
            })
            .catch((err) => {
                if(!this.open) return;
                this.setState({
                    loading: false
                });
                log.error(err);
                message.error('获取顾问列表失败:' + err.message);
            });
    }
    handleChangeManager(managerId) {
        const {onChange, value} = this.props;
        onChange(value.map(function(id, index) {
            if(index === 1) return managerId;
            else return id;
        }));
    }
    handleChangeGroup(groupId) {
        const {onChange} = this.props;
        onChange([groupId, '']);
    }
}

ManagerSelect.propTypes = {
    disabled: PropTypes.bool,
    groupId: PropTypes.string,
    value: PropTypes.array,
    onChange: PropTypes.func
};

export default ManagerSelect;