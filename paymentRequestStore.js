Ext.onReady(function () {
    var apiUrl = "";
    var paymentRequestWebUrl = "";
    var paymentRequestID = Ext.Object.fromQueryString(location.search).ID;
    var listTitle = encodeURI("Заявки на оплату");

    // Хранилище позиций заявок на оплату
    Ext.create('Ext.data.Store', {
        storeId: 'paymentRequest_Position_Store',
        autoLoad: true,
        model: 'PaymentRequest_Position',
        proxy: {
            type: 'jsonp',
            url: apiUrl + 'PaymentRequest_Position/List?paymentRequestID=' + paymentRequestID,
            reader: {
                type: 'json',
                rootProperty: 'data'
            }
        },
        listeners: {
            add: function (store, records, index, eOpts) {
                Ext.data.JsonP.request({
                    url: apiUrl + 'PaymentRequest_Position/Insert',
                    params: { Number: records[0].data.Number, Title: records[0].data.Title, Cost: records[0].data.Cost, BOS: records[0].data.BOS, ParentDocID: paymentRequestID },
                    timeout: 300,
                    callback: function () {
                        setTimeout(function () { }, 800);
                    }
                });
            },
            update: function (t, record, operation, modifiedFieldNames, eOpts) {
                Ext.data.JsonP.request({
                    url: apiUrl + 'PaymentRequest_Position/Update',
                    params: { ID: record.data.ID, Number: record.data.Number, Title: record.data.Title, Cost: record.data.Cost, BOS: record.data.BOS },
                    timeout: 300,
                    callback: function () {
                        setTimeout(function () { }, 800);
                    }
                });
                //CheckCostDifference(Ext.data.StoreManager.lookup('contractPropertiesStore').first().data.Cost, t, Ext.getCmp('contractPositionGrid'));
            },
            remove: function (store, record, index, isMove, eOpts) {
                Ext.data.JsonP.request({
                    url: apiUrl + 'PaymentRequest_Position/Delete',
                    params: { ID: record[0].data.ID },
                    timeout: 300,
                    callback: function () {
                        var grid = Ext.getCmp('paymentRequestPositionGrid')
                        if((store.data.length == 0)&&(grid.budgetCopyFlag == true)){
                            SwitchBudgetCopyFlag(false, paymentRequestID, listTitle, paymentRequestWebUrl, grid);
                            LockManualAdditionBudgetPostition(false,grid);
                        }
                            

                        store.reload();
                        setTimeout(function () {
                        }, 800);
                    }
                });
            },
            load: function () {
                var store = this;
                var grid = Ext.getCmp('paymentRequestPositionGrid');
                if((grid != undefined)&&(grid.parentDocCost != null)){
                    // Если в документе основания есть сумма, то проценты расчитываются от нее, иначе берется сумма позиций текущей заявки
                    SetPercentStore(grid.parentDocCost,this);
                    Ext.getCmp('paymentRequestPositionGrid').getView().refresh();
                }
            },
            beforeload: function (store, operation, options) {}
        }
    });


    // Хранилище бюджетных позиций заявок на оплату
    Ext.define('PaymentRequest_BudgetPosition_Store', {
        extend: 'Ext.data.Store',
        alias: 'store.PaymentRequest_BudgetPosition_Store',
        model: 'PaymentRequest_BudgetPosition',
        proxy: {
            type: 'jsonp',
            //url: apiUrl + 'PaymentRequest_BudgetPosition/List?paymentRequestID=' + paymentRequestID,
            url: apiUrl + 'PaymentRequest_BudgetPosition/List',
            reader: {
                type: 'json',
                rootProperty: 'data'
            }
        },
        listeners: {
            add: function (store, records, index, eOpts) {
                Ext.data.JsonP.request({
                    url: apiUrl + 'PaymentRequest_BudgetPosition/Insert',
                    params: { Cost: records[0].data.Cost, BOS: records[0].data.BOS, ParentPositionID: records[0].data.ParentPositionID, BudgetPositionID: records[0].data.BudgetPositionID },
                    timeout: 300,
                    callback: function () {
                        setTimeout(function () { }, 800);
                    }
                });
            },
            update: function (t, record, operation, modifiedFieldNames, eOpts) {
                Ext.data.JsonP.request({
                    url: apiUrl + 'PaymentRequest_BudgetPosition/Update',
                    params: { ID: record.data.ID, Cost: record.data.Cost, BOS: record.data.BOS, BudgetCheck: record.data.BudgetCheck },
                    timeout: 300,
                    callback: function () {
                        setTimeout(function () { }, 800);
                    }
                });
            },
            remove: function (store, record, index, isMove, eOpts) {
                Ext.data.JsonP.request({
                    url: apiUrl + 'PaymentRequest_BudgetPosition/Delete',
                    params: { ID: record[0].data.ID },
                    timeout: 300,
                    callback: function () {
                        store.reload();
                        setTimeout(function () {
                        }, 800);
                    }
                });
            },
            //load: function () { },
            //beforeload: function (store, operation, options) { }
        }
    });

});