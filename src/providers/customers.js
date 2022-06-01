// Customers list
// Example:
// [
//   {
//      customer_id: 98,
//      display_name: 'Bobby Shaftoe',
//      channels: [
//          { type: 'email', value: 'bobby@example.com' },
//          { type: 'sms', value: '+123456789' },
//          { type: 'whatsapp', value: 'whatsapp:+123456789' }
//      ],
//      links: [
//          { type: 'Facebook', value: 'https://facebook.com', display_name: 'Social Media Profile' }
//      ],
//      details:{
//          title: "Information",
//          content: "Status: Active" + "\n\n" + "Score: 100"
//      },
//      worker: 'john@example.com'
//   }
// ]

const customers = [
    {
        customer_id: 1,
        display_name: "Dmytro Savin",
        channels: [
            { type: 'sms', value: '+37253551669' },
            { type: 'whatsapp', value: 'whatsapp:+37253551669' }
        ],
        opt_out: {
            
        }
    }
];

const getCustomersList = async (worker, pageSize, anchor) => {
    const workerCustomers = customers;
    const list = workerCustomers.map(customer => ({
        display_name: customer.display_name,
        customer_id: customer.customer_id,
        avatar: customer.avatar,
    }));

    if (!pageSize) {
        return list
    }

    if (anchor) {
        const lastIndex = list.findIndex((c) => String(c.customer_id) === String(anchor))
        const nextIndex = lastIndex + 1
        return list.slice(nextIndex, nextIndex + pageSize)
    } else {
        return list.slice(0, pageSize)
    }
};

const getCustomerByNumber = async (customerNumber) => {
    return customers.find(customer => customer.channels.find(channel => String(channel.value) === String(customerNumber)));
};

const getCustomerById = async (customerId) => {
    return customers.find(customer => String(customer.customer_id) === String(customerId));
};

const updateCustomer = async (customerId, payload) => {
    return getCustomerById(customerId)
    .then(customer => {
        Object.assign(customer, payload)
        return customer;
    })
}

module.exports = {
    updateCustomer,
    getCustomerById,
    getCustomersList,
    getCustomerByNumber
};
