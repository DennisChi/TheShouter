import { useState, useEffect } from 'react';
import useIpfsFactory from './hooks/use-ipfs-factory.js'
import { ethers } from 'ethers';
import { Modal, Image, Card, Input, Tooltip, Button, List, Col, Row, Divider } from 'antd';
// import useIpfs from './hooks/use-ipfs.js'
import TheShouter from './util/TheShouter.json'
import { RelayProvider } from '@opengsn/provider'
import { Web3 } from 'web3'
import 'antd/dist/antd.css'; // or 'antd/dist/antd.less'

const CONTRACT_ADDRESS = '0x0B306BF915C4d645ff596e518fAf3F9669b97016';

const PAYMASTER_ADDRESS = '';

const { Meta } = Card;




const FALLBACK_IMG = "data:image/png;base64,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";


function App() {
  // web3 state
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);

  // ipfs state
  const { ipfs, ipfsInitError } = useIpfsFactory({ commands: ['id'] })

  // board state
  const [boardImg, setBoardImg] = useState(FALLBACK_IMG);
  const [boardLink, setBoardLink] = useState(null);
  const [boardTitle, setBoardTitle] = useState('');
  const [commentList, setCommentList] = useState([]);
  // const [maxBoardIndex, setMaxBoardIndex] = useState(0);

  // render state
  const [applying, setApplying] = useState(false);
  const [comment, setComment] = useState('');
  const [account, setAccount] = useState(null);

  // upload state
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadLink, setUploadLink] = useState('');
  const [charge, setCharge] = useState('')
  const [previewImage, setPreviewImage] = useState('');

  // todo: split to multi useEffect
  useEffect(() => {
    const fetchData = async () => {
      if (!ipfs) {
        return
      }

      if (!contract) {
        return;
      }

      const maxBoardIndexResult = await contract.maxBoardIndex();
      const maxBoardIndex = maxBoardIndexResult.toString();

      // ipfs fetch uri
      const boardUri = await contract.tokenURI(maxBoardIndex);
      const stream = ipfs.cat(boardUri)
      const decoder = new TextDecoder()
      let data = ''

      for await (const chunk of stream) {
        data += decoder.decode(chunk, { stream: true })
      }

      // set basic data
      const info = JSON.parse(data);
      setBoardTitle(info.title);
      setBoardLink(info.link);
      let imgURI = info.image;
      if (imgURI.startsWith("ipfs://")) {
        imgURI = imgURI.substring(7)
      }
      imgURI = `http://ipfs.io/ipfs/${imgURI}`
      console.log(imgURI)
      setBoardImg(imgURI)

      // fetch comments
      const comments = await contract.queryComments(maxBoardIndex);
      setCommentList(comments);
    }

    fetchData();
  }, [ipfs, contract]);

  useEffect(() => {
    const prepare = async () => {
      const config = {
        PAYMASTER_ADDRESS,
        loggerConfiguration: {
          logLevel: 'debug',
          // loggerUrl: 'logger.opengsn.org',
        }
      }

      const ethereumProvider = new ethers.providers.Web3Provider(window.ethereum);
      const gsnProvider = await RelayProvider.newProvider({ provider: ethereumProvider, config }).init()
      const gsnWeb3 = new Web3(gsnProvider)
      const signer = gsnProvider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        TheShouter.abi,
        signer
      );
      setContract(contract);
      setProvider(gsnProvider)
    }
  })

  const onConnectWalletClick = async () => {
    const { ethereum } = window;
    if (!ethereum) {
      console.log('require Metamask');
      return;
    }

    const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
    console.log('Connected to ', accounts[0]);
    setAccount(accounts[0]);
  }

  const onCommitCommentClick = async () => {
    if (!contract) {
      return;
    }

    const commentBytes = ethers.utils.toUtf8Bytes(comment);
    const tx = await contract.commitComment(commentBytes);
    console.log('commit comment', tx)
  }

  const renderBoard = () => {
    return (
      <Row>
        <Col style={{ blockAlign: '0 auto' }}>
          <Card
            hoverable
            cover={
              <Image
                src={boardImg}
              />
            }
          >
            <Meta title={boardTitle} />
            <a href={boardLink}>{boardLink}</a>
          </Card>
        </Col>
      </Row>
    );
  };

  const renderFuncsLine = () => {
    return (
      <Col style={{ margin: 12 }}>
        <Row>
          <Col offset={5}>
            <Button onClick={() => setApplying(true)}>Apply Board</Button>
          </Col>
          <Col offset={2}>
            {account
              ? <Input value={account.substring(0, 6) + '......' + account.substring(account.length - 4)}
                style={{ width: 135 }}
              />
              : <Button onClick={onConnectWalletClick} style={{ width: 135 }}>Connect Wallet</Button>
            }
          </Col>
        </Row>
      </Col>
    );
  };

  const renderCommentSquare = () => {
    const convertComment = (comment) => {
      return (
        <div>
          {ethers.utils.toUtf8String(comment)}
        </div>
      );
    }

    let reverseList = []
    for (let i = commentList.length - 1; i >= 1; i--) {
      reverseList.push(commentList[i])
    }

    return (
      <Card title='Comment'>
        <Row>
          <Input.TextArea rows={3} onChange={e => setComment(e.target.value)} />
        </Row>
        <Row>
          <Col offset={19}>
            <Button onClick={onCommitCommentClick}>commit</Button>
          </Col>
        </Row>
        <List
          bordered
          dataSource={reverseList}
          renderItem={item => <List.Item>{convertComment(item)}</List.Item>}
        />
      </Card>
    );
  };

  const renderApplying = () => {
    const onUploadChange = (e) => {
      const file = e.target.files[0]
      setUploadFile(file)
      const fileURL = URL.createObjectURL(file)
      setPreviewImage(fileURL);

      console.log(fileURL)
    }

    const onOk = () => {
      const upload = async () => {
        if (!contract) {
          return;
        }
        // ipfs prepare
        const imgUploadResult = await ipfs.add(uploadFile);

        const obj = {
          title: uploadTitle,
          link: uploadLink,
          image: imgUploadResult.path
        }

        const uploadJson = JSON.stringify(obj)
        const jsonUploadResult = await ipfs.add(uploadJson)
        console.log('ipfs', jsonUploadResult)

        const rentable = await contract.interactable();
        console.log(rentable)
        if (!rentable) {
          return
        }
        const boardUri = jsonUploadResult.path
        const tx = await contract.rentBoard(boardUri, {
          value: ethers.utils.parseEther(charge)
        })
        console.log(tx)
      }

      upload();
    }

    return (
      <Modal
        visible={applying}
        onCancel={() => setApplying(false)}
        onOk={onOk}
        closable={false}
      >
        <Image width={300} height={300} src={previewImage} />
        <Input style={{ width: 300 }} type='file' accept='image/*' onChange={onUploadChange} id='upFile' />
        <Input addonBefore='Title: ' onChange={e => setUploadTitle(e.target.value)} />
        <Input addonBefore='Link: ' onChange={e => setUploadLink(e.target.value)} />
        <Input addonBefore='Charge (Ether): ' onChange={e => setCharge(e.target.value)} />
      </Modal>
    )
  }

  return (
    <div style={{ background: '#f0f5ff' }}>
      <Col offset={8} span={8} style={{ border: 'solid', borderWidth: 2, background: 'white', borderColor: '#d6e4ff' }}>
        <Card>
          <Button onClick={() => { const from = provider.newAccount().address; console.log('from', from) }}>Test</Button>
          {renderApplying()}
          {renderBoard()}
          {renderFuncsLine()}
          {renderCommentSquare()}
        </Card>
      </Col>
    </div>
  );
}

export default App;
