import { NextResponse } from 'next/server';

// Exemplo de payload do Kiwify baseado no exemplo fornecido
const sampleKiwifyPayload = {
  context: {
    id: "2txvsqqCJeyFxKyI87OVSGjS28i",
    ts: "2025-03-07T00:19:09.465Z",
    pipeline_id: null,
    workflow_id: "p_RRCmLrw",
    deployment_id: "d_WpsORBYZ",
    source_type: "TRACE",
    verified: false,
    hops: null,
    test: true,
    replay: false,
    owner_id: "o_zwIPbmr",
    platform_version: "3.56.1",
    workflow_name: "RequestBin",
    resume: null,
    emitter_id: "hi_KNHDRk2",
    external_user_id: null,
    external_user_environment: null,
    trace_id: "2txvsqqCJeyFxKyI87OVSGjS28i",
    project_id: "proj_Dasap2R"
  },
  event: {
    body: {
      Commissions: {
        charge_amount: 7285,
        commissioned_stores: [
          {
            custom_name: "Example store",
            email: "example@store.domain",
            id: "e78cae4f-4ddf-4504-a3d1-93611d486dcc",
            type: "producer",
            value: "6484"
          },
          {
            custom_name: "Example coproducer",
            email: "example@coproducer.domain",
            id: "987b7499-e055-4609-af93-2c27474bd1e4",
            type: "coproducer",
            value: "6484"
          },
          {
            affiliate_id: "KIxTyJO",
            custom_name: "Example affiliate",
            email: "example@affiliate.domain",
            id: "88d52622-4bc7-4894-b714-c3f7b50c17c7",
            type: "affiliate",
            value: "6484"
          }
        ],
        currency: "BRL",
        deposit_date: null,
        estimated_deposit_date: null,
        funds_status: null,
        kiwify_fee: 801,
        kiwify_fee_currency: "BRL",
        my_commission: 6484,
        product_base_price: 7285,
        product_base_price_currency: "BRL",
        sale_tax_amount: 0,
        sale_tax_rate: 0,
        settlement_amount: 7285,
        settlement_amount_currency: "BRL"
      },
      Customer: {
        city: "Balneário Camboriú",
        cnpj: "94790271771167",
        complement: "SL 05",
        email: "", // Será preenchido dinamicamente
        first_name: "John",
        full_name: "John Doe",
        instagram: "@kiwify",
        ip: "52.11.104.237",
        mobile: "+64784338140",
        neighborhood: "Centro",
        number: "315",
        state: "SC",
        street: "Rua 1001",
        zipcode: "88330-756"
      },
      Product: {
        product_id: "75e7af55-3948-4212-90c4-2000b872a35f",
        product_name: "Example product"
      },
      Subscription: {
        charges: {
          completed: [
            {
              amount: 6484,
              card_first_digits: "824338",
              card_last_digits: "7450",
              card_type: "mastercard",
              created_at: "2025-03-04T00:18:58.097Z",
              installments: 1,
              order_id: "30e161c3-11de-45d3-a950-7f6a68b9ccff",
              status: "paid"
            }
          ],
          future: [
            {
              charge_date: "2025-03-11T00:18:58.097Z"
            }
          ]
        },
        id: "3d69fc1f-3ae2-456e-ac03-4dbd46824932",
        next_payment: "2025-03-11T00:18:58.097Z",
        plan: {
          frequency: "weekly",
          id: "40e6083c-3820-4fb1-975b-82f7af9b142b",
          name: "Example plan",
          qty_charges: 0
        },
        start_date: "2025-03-04T00:18:58.097Z",
        status: "active"
      },
      TrackingParameters: {
        sck: null,
        src: null,
        utm_campaign: null,
        utm_content: null,
        utm_medium: null,
        utm_source: null,
        utm_term: null
      },
      access_url: null,
      approved_date: "2025-03-08 00:18",
      boleto_URL: null,
      boleto_barcode: null,
      boleto_expiry_date: null,
      card_last4digits: "2927",
      card_rejection_reason: null,
      card_type: "mastercard",
      created_at: "2025-03-07 00:18",
      installments: 1,
      order_id: "30e161c3-11de-45d3-a950-7f6a68b9ccff",
      order_ref: "btxbicE",
      order_status: "paid",
      payment_merchant_id: 62314548,
      payment_method: "credit_card",
      pix_code: null,
      pix_expiration: null,
      product_type: "membership",
      refunded_at: null,
      sale_type: "producer",
      store_id: "d6BjlKzW0ZcvK8d",
      subscription_id: "3d69fc1f-3ae2-456e-ac03-4dbd46824932",
      updated_at: "2025-03-07 00:18",
      webhook_event_type: "order_approved"
    },
    client_ip: "34.95.238.190",
    headers: {
      accept: "application/json, text/plain, */*",
      "content-length": "2636",
      "content-type": "application/json",
      host: "eol9dz7l1o5grc7.m.pipedream.net",
      traceparent: "00-1726944104e0d1321549ab73ca181ba2-999668493838831a-01",
      "user-agent": "axios/0.23.0"
    },
    method: "POST",
    path: "/",
    query: {
      signature: "adf7ffc98379eebf8d9f7757fc7e30ca7c7742b5"
    },
    url: "https://eol9dz7l1o5grc7.m.pipedream.net/?signature=adf7ffc98379eebf8d9f7757fc7e30ca7c7742b5"
  }
};

// Função para enviar a requisição ao webhook
const triggerWebhook = async (email: string): Promise<any> => {
  try {
    // Modificar o payload para incluir o email fornecido
    const payload = JSON.parse(JSON.stringify(sampleKiwifyPayload));
    payload.event.body.Customer.email = email;
    
    // Gerar uma nova assinatura aleatória para o teste
    const signature = Math.random().toString(36).substring(2);
    
    // Construir a URL do webhook
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/kiwify?signature=${signature}`;
    
    console.log(`Enviando requisição de teste para: ${webhookUrl}`);
    console.log(`Com email: ${email}`);
    
    // Enviar a requisição para o webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error('Erro ao testar webhook:', error);
    return { error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get('email');
  
  if (!email) {
    return NextResponse.json({ error: 'Email não fornecido. Use ?email=exemplo@email.com' }, { status: 400 });
  }
  
  const result = await triggerWebhook(email);
  
  return NextResponse.json({
    success: true,
    message: 'Teste do webhook Kiwify enviado',
    email,
    result
  });
} 