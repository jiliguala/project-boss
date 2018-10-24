import React, {Component} from 'react';
import PropTypes from 'prop-types';
import { Spin, Icon, message } from 'antd';

import { fetch } from '../../common/api';

const iconStyle = {
    fontSize: '22px',
    color: '#333',
    verticalAlign: 'top',
    cursor: 'pointer'
};

//封装组件
class PhoneHandle extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            truePhone: '',
            viewable: false
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleChangeViewable = this.handleChangeViewable.bind(this);
        this.open = true;
    }
    componentWillUnmount() {
        this.open = false;
    }
    render() {
        const { loading, truePhone, viewable } = this.state;
        const { phone } = this.props;
        return (
            <div style={{
                display: 'inline-block',
                verticalAlign: 'top',
            }}>
                <Spin spinning={!truePhone && loading}>
                    <span>{viewable ? truePhone : phone}</span>
                    {viewable ? 
                        <Icon type="eye" className="m-l-sm" onClick={this.handleChangeViewable} style={iconStyle} title="隐藏" /> : 
                        <Icon type="eye" className="m-l-sm" onClick={this.handleChange} style={iconStyle} title="显示" />}
                </Spin>
            </div>
        );
    }
    handleChange() {
        const { truePhone } = this.state, t = this;
        const {url, ciphertext, monitorItem, operatorType, sceneDetailId, userId, businessId, handleDefault} = this.props;
        if(truePhone) {
            this.handleChangeViewable();
            return;
        }
        this.setState({
            loading: true
        });
        let sendData = {
            ciphertext: ciphertext, // 密文
            monitorItem: monitorItem || '1', // 监控项 1:电话号码
            operatorType: operatorType || '1', // 操作人类型 1:顾问 2:用户
            sceneDetailId: sceneDetailId || 0, // 场景明细ID
            userId: userId || 0, // 客户ID
            businessId: businessId || 0, // 业务ID
        };
        fetch(url || 'djy-decode', sendData, 'jsonp', {
            jsonpCallback: 'callback'
        })
            .then((data) => {
                // 判断如果卸载,则不再设置数据
                if(!this.open) return;
                this.setState({
                    loading: false,
                    truePhone: data.data.phone
                });
                t.handleChangeViewable();
                if(handleDefault) handleDefault(data.data.phone); // 编辑的时候需要明文电话
            })
            .catch((err) => {
                message.error(err.message || '获取电话号码失败');
                this.setState({
                    loading: false
                });
            });
    }
    handleChangeViewable() {
        const { viewable } = this.state;
        this.setState({
            viewable: !viewable
        });
    }
}

PhoneHandle.propTypes = {
    url: PropTypes.string, // 获取明文电话以及生成日志的接口地址
    phone: PropTypes.string, // 带星的电话号码
    ciphertext: PropTypes.string, // 密文
    monitorItem: PropTypes.number, // 监控项
    operatorType: PropTypes.number, // 操作人类型
    sceneDetailId: PropTypes.string, // 场景明细ID
    userId: PropTypes.number, // 客户ID
    businessId: PropTypes.number, // 业务ID
    handleDefault: PropTypes.func // 编辑需要的方法
};

export default PhoneHandle;