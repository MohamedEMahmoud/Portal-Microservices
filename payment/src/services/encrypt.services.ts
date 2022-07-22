import crypto from 'crypto';

const encrypt = (text: string) => {
  const iv = crypto.randomBytes(16);

  const ciper = crypto.createCipheriv(
    process.env.algorithm!,
    process.env.ENCRYPT_SECRET_KEY!,
    iv
  );

  const encrypted = Buffer.concat([ciper.update(text), ciper.final()]);

  return {
    iv: iv.toString('hex'),
    content: encrypted.toString('hex'),
  };
};

const decrypt = (hash: any) => {
  const decipher = crypto.createDecipheriv(
    process.env.algorithm!,
    process.env.ENCRYPT_SECRET_KEY!,
    Buffer.from(hash.iv, 'hex')
  );

  const decrpyted = Buffer.concat([
    decipher.update(Buffer.from(hash.content, 'hex')),
    decipher.final(),
  ]);

  return decrpyted.toString();
};

export { encrypt, decrypt };
