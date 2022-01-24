import * as crypto from 'crypto';


class MedicalRecord {
  constructor(
    public patient: string,
    public doctor: string,
    public diagnose: string 
  ) {}

  toString() {
    return JSON.stringify(this)
  }
}

class Block {

  public nonce = Math.round(Math.random() * 999999999);

  constructor(
    public prevHash: string, // cannot be reconstructed
    public medicalRecord: MedicalRecord,
    public ts = Date.now()
  ) {}

  get hash() {
    const str = JSON.stringify(this);
    const hash = crypto.createHash('SHA256');
    hash.update(str).end();
    return hash.digest('hex');
  }
}

class Chain {
  public static instance = new Chain();

  chain: Block[];

  constructor() {
    this.chain = [new Block('', new MedicalRecord('Aapo Leppanen', 'Vilhelm Toivonen,', 'He just seemed kinda stupid'))]
  }

  get lastBlock() {
    return this.chain[this.chain.length - 1]
  }

  mine (nonce: number) {
    let solution = 1;
    console.log('⛏ mining...');

    while (true) {
      const hash = crypto.createHash('MD5');
      hash.update((nonce + solution).toString()).end();

      const attempt = hash.digest('hex')

      if (attempt.substring(0, 4) === '0000') {
        console.log(`Solved: ${solution}`);
        return solution;
      }

      solution += 1;
    }
  }

  addBlock(medicalRecord: MedicalRecord, senderPublicKey: string, signature: Buffer) {
    const verifier = crypto.createVerify('SHA256');
    verifier.update(medicalRecord.toString());

    const isValid = verifier.verify(senderPublicKey, signature);

    if (isValid) {
      const newBlock = new Block(this.lastBlock.hash, medicalRecord);
      this.mine(newBlock.nonce);
      this.chain.push(newBlock);
    }
  }
}

class Patient {
  public publicKey: string;
  public privateKey: string;

  constructor() {
    const keypair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    this.privateKey = keypair.privateKey;
    this.publicKey = keypair.publicKey;
  }

  addRecord(diagnose: string, payeePublicKey: string) {
    const medicalRecord = new MedicalRecord(this.publicKey, payeePublicKey, diagnose);

    const sign = crypto.createSign('SHA256');
    sign.update(medicalRecord.toString()).end();

    const signature = sign.sign(this.privateKey);
    Chain.instance.addBlock(medicalRecord, this.publicKey, signature);
  }
}

const satoshi = new Patient();
const bob = new Patient();
const alice = new Patient();

satoshi.addRecord('super sick, prob covid', bob.publicKey);
bob.addRecord('was not sick, clearly bullshitting', alice.publicKey);
alice.addRecord('Was blinded becuse fell in a well', bob.publicKey);

console.log(Chain.instance.chain);