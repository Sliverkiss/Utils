/**
* 刷新青龙环境变量
* @param {*} ql_port 5700
* @param {*} ql_port xxx
* @param {*} ql_client_secret xxx
*/
async function refreshQingLong(userCookie, ckName) {
    try {
        if (!$.isNode()) return;

        let port = process.env['ql_port'] || '';
        let client_id = process.env['ql_client_id'] || '';
        let client_secret = process.env['ql_client_secret'] || '';

        let ql = await loadQingLong({
            "host": `http://127.0.0.1:${port}`,
            "clientId": client_id,
            "secret": client_secret
        });
        await ql.checkLogin();
        await ql.getEnvs();
        let [user,] = ql.selectEnvByName(ckName);
        try {
            await ql.updateEnv({ value: $.toStr(userCookie), name: ckName, remarks: `${user?.remarks}`, id: `${user?.id}` })
        } catch (e) {

        }
    } catch (e) {

    }
    async function loadQingLong(QL) {
        let code = $.getdata('qinglong_code') || '';
        if (code && Object.keys(code).length) {
            $.info(`[QingLong] 模块加载成功,请继续`);
            eval(code);
            return new QingLong(QL.host, QL.clientId, QL.secret);
        }
        $.info(`[QingLong] 开始安装模块...`);
        return new Promise(async (resolve) => {
            $.getScript('https://fastly.jsdelivr.net/gh/Sliverkiss/QuantumultX@main/Utils/QingLong.min.js').then((fn) => {
                $.setdata(fn, "qinglong_code");
                eval(fn);
                const ql = new QingLong(QL.host, QL.clientId, QL.secret);
                $.info(`[QingLong] 模块加载成功,请继续`);
                resolve(ql);
            })
        })
    };
}
