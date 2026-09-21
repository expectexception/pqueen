const base = 'https://my.ithinklogistics.com/api_v3';
const access_token = '85fec8bccd7fafd40a9ed5d486080cb8';
const secret_key = '6fae1c13bc110ed5b42cb84dc2b533c8';

async function testIthink() {
  try {
    console.log('Testing warehouse/get.json...');
    const whRes = await fetch(`${base}/warehouse/get.json`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'access-token': access_token,
        'secret-key': secret_key
      },
      body: JSON.stringify({
        data: {
          access_token,
          secret_key
        }
      })
    });
    console.log('Warehouse HTTP Status:', whRes.status);
    const whText = await whRes.text();
    console.log('Warehouse Response:', whText);
  } catch (e) {
    console.error('Warehouse error:', e);
  }

  try {
    console.log('\nTesting pincode/check.json...');
    const pinRes = await fetch(`${base}/pincode/check.json`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'access-token': access_token,
        'secret-key': secret_key
      },
      body: JSON.stringify({
        data: {
          access_token,
          secret_key,
          pincode: '110059',
          from_pincode: '110059',
          to_pincode: '400001'
        }
      })
    });
    console.log('Pincode HTTP Status:', pinRes.status);
    const pinText = await pinRes.text();
    console.log('Pincode Response:', pinText);
  } catch (e) {
    console.error('Pincode error:', e);
  }

  try {
    console.log('\nTesting order/add.json...');
    const orderNum = 'PQN-TEST-' + Date.now();
    const addPayload = {
      data: {
        access_token,
        secret_key,
        pickup_address_id: '123718',
        s_type: 'surface',
        shipments: [
          {
            order: orderNum,
            sub_order: orderNum,
            order_date: new Date().toISOString().split('T')[0],
            total_amount: '2999.00',
            name: 'Priyanka Sharma',
            company_name: '',
            add: 'WZ 147 A D Block 2 Uttam Nagar',
            add2: 'Arya Samaj Road',
            pin: '110059',
            city: 'New Delhi',
            state: 'Delhi',
            country: 'India',
            phone: '9958907429',
            alt_phone: '9958907429',
            email: 'concierge@pqnpartyqueen.com',
            is_insurance: '0',
            shipping_charges: '0',
            giftwrap_charges: '0',
            transaction_charges: '0',
            total_discount: '0',
            first_attemp_discount: '0',
            other_charges: '0',
            payment_mode: 'Prepaid',
            cod_amount: '0',
            reseller_name: '',
            eway_bill_number: '',
            gst_number: '',
            return_address_id: '123718',
            is_billing_same_as_shipping: 'YES',
            logistic_id: '',
            s_type: 'surface',
            shipment_length: '30',
            shipment_width: '25',
            shipment_height: '8',
            shipment_weight: '0.8',
            length: '30',
            breadth: '25',
            width: '25',
            height: '8',
            weight: '0.8',
            products: [
              {
                product_name: 'Luxury Velvet Ensemble',
                product_sku: 'PQN-TEST-SKU',
                product_quantity: '1',
                product_price: '2999.00',
                product_tax_rate: '12',
                product_hsn_code: '6204',
                product_discount: '0',
                length: '30',
                width: '25',
                breadth: '25',
                height: '8',
                weight: '0.8'
              }
            ]
          }
        ]
      }
    };

    const addRes = await fetch(`${base}/order/add.json`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'access-token': access_token,
        'secret-key': secret_key
      },
      body: JSON.stringify(addPayload)
    });
    console.log('Order Add HTTP Status:', addRes.status);
    const addText = await addRes.text();
    console.log('Order Add Response:', addText);
  } catch (e) {
    console.error('Order add error:', e);
  }
}

testIthink();
