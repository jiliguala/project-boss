import moment from 'moment';

/**
 * 格式化数字
 * @param  {Number} number 格式化前数字
 * @param  {Number} digit  位数
 * @return {Number}        格式化后数字
 */
export function formatNumber(number, digit) {
    const accuracyNum = Math.pow(10, digit);
    return parseFloat(Math.round(number * accuracyNum) / accuracyNum);
}

/**
 * 格式化价格
 * @param  {Number} price 价格
 * @return {String}       格式化后的价格
 */
export function formatPrice(price) {
    return formatNumber(price, 2).toFixed(2);
}

/**
 * 格式化日期
 * @param  {Any}    dateData 支持时间戳10/13位,日期对象,字符串
 * @param  {String} format   格式化形式
 * @return {String}          格式化后日期
 */
export function formatDate(dateData, format) {
    switch(typeof dateData) {
    case 'string':
    case 'number':
        dateData = dateData.toString();
        if(isNaN(dateData)) { // 如果是纯字符串
            return moment(new Date(dateData)).format(format);
        }
        if(dateData.length === 10) return moment(new Date(parseInt(dateData) * 1000)).format(format);
        // 如果是其他数字,则直接转义
        return moment(new Date(parseInt(dateData))).format(format);
    case 'object':
        if(dateData instanceof Date) {
            return moment(dateData).format(format);
        }
        break;
    }
    return '-';
}