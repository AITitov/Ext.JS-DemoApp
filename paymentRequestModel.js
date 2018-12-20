// Заявка на оплату - позиции
Ext.define('PaymentRequest_Position', {
    extend: 'Ext.data.Model',
    fields: [{
        name: 'ID',
        type: 'int'
    }, {
        name: 'Number',
        type: 'string'
    }, {
        name: 'Title',
        type: 'string'
    }, {
        name: 'Cost',
        type: 'float'
    }, {
        name: 'BOS',
        type: 'boolean'
    }, {
        name: 'ParentDocID',
        type: 'boolean'
    }]
});

// Заявка на оплату - Бюджетные позиции
Ext.define('PaymentRequest_BudgetPosition', {
    extend: 'Ext.data.Model',
    fields: [{
        name: 'ID',
        type: 'int'
    }, {
        name: 'Code',
        type: 'string'
    }, {
        name: 'Title',
        type: 'string'
    }, {
        name: 'Cost',
        type: 'float'
    }, {
        name: 'BOS',
        type: 'boolean'
    }, {
        name: 'BudgetCheck',
        type: 'boolean'
    }, {
        name: 'ParentPositionID',
        type: 'int'
    }, {
        name: 'BudgetPositionID',
        type: 'int'
    }]
});

// Заявка на оплату
Ext.define('PaymentRequest', {
    extend: 'Ext.data.Model',
    fields: [{
        name: 'ID',
        type: 'int'
    }, {
        name: 'Counteragent',
        type: 'string'
    }, {
        name: 'Contract',
        type: 'string'
    }, {
        name: 'Entities',
        type: 'string'
    }, {
        name: 'CFO',
        type: 'string'
    }, {
        name: 'Project',
        type: 'string'
    }, {
        name: 'PaymentPlannedDate',
        type: 'date'
    }, {
        name: 'PaymentPurpose',
        type: 'string'
    }, {
        name: 'VATRate',
        type: 'string'
    }, {
        name: 'Note',
        type: 'string'
    }, {
        name: 'PaymentSum',
        type: 'string'
    }, {
        name: 'PaymentActualDate',
        type: 'date'
    }, {
        name: 'PaymentActualStatus',
        type: 'string'
    }, {
        name: 'PaymentNote',
        type: 'string'
    }, {
        name: 'Currency',
        type: 'string'
    }, {
        name: 'PaymentType',
        type: 'string'
    }, {
        name: 'PaymentStatus',
        type: 'string'
    }, {
        name: 'ClosingDoc',
        type: 'string'
    }
    ]
});

// Свойство доксета
Ext.define('Property', {
    extend: 'Ext.data.Model',
    fields: [{
        name: 'Title',
        type: 'string'
    }, {
        name: 'Value',
        type: 'string'
    }]
});

// Проверка по бюджету
Ext.define('BudgetCheck', {
    extend: 'Ext.data.Model',
    fields: [{
        name: 'Title',
        type: 'string'
    }, {
        name: 'Period1',
        type: 'float'
    }, {
        name: 'Period2',
        type: 'float'
    }, {
        name: 'Period3',
        type: 'float'
    }]
});

// Проверка по договору
Ext.define('ContractCheck', {
    extend: 'Ext.data.Model',
    fields: [{
        name: 'Title',
        type: 'string'
    }, {
        name: 'Value',
        type: 'float'
    }]
});