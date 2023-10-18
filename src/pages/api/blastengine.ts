import type { NextApiRequest, NextApiResponse } from 'next'
import { BlastEngine, Mail } from 'blastengine';
import fetch from 'node-fetch';

type Data = {
  delivery_id?: number,
  error?: string
}

// blastengine SDKの初期化
new BlastEngine(process.env.BLASTENGINE_USER_ID!, process.env.BLASTENGINE_API_KEY!);

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>
  ) {
  const { body } = req;
  // microCMSへの登録
  const response = await fetch(process.env.MICROCMS_ENDPOINT!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-MICROCMS-API-KEY': process.env.MICROCMS_API_KEY!
    },
    body: JSON.stringify({
      name: body.name,
      email: body.email,
      company: body.company,
      type: [body.type],
      message: body.message,
    })
  });

  if (!response.ok) {
    const text = await response.text();
    res.status(500).json({ error: `microCMSへの登録に失敗しました\n ${text}` });
    return;
  }
  const mail = new Mail();
  const text = `__USERNAME__様

お問い合わせいただきありがとうございます。内容を確認し、追ってご連絡いたします。

会社名：
__COMPANY__
お名前：
__USERNAME__
お問い合わせ内容：
__MESSAGE__
`;
  mail
    .setFrom('info@opendata.jp', '管理者')
    .setSubject('お問い合わせありがとうございます')
    .addTo(body.email, { USERNAME: body.name, COMPANY: body.company, MESSAGE: body.message })
    .setText(text)
    .setEncode('UTF-8');
  await mail.send();
  res.status(200).json({ delivery_id: mail.deliveryId! });
}