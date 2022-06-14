import { useState, useEffect } from 'react';
import useIpfsFactory from './hooks/use-ipfs-factory.js'
import { ethers } from 'ethers';
import { Modal, Image, Card, Input, Button, List, Col, Row } from 'antd';
import TheShouter from './util/TheShouter.json'
import { RelayProvider } from '@opengsn/provider'
import Web3 from 'web3'
import 'antd/dist/antd.css'; 

const CONTRACT_ADDRESS = '0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1';

const PAYMASTER_ADDRESS = '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707';

const { Meta } = Card;

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
      if (!account) {
        await onConnectWalletClick();
        return;
      }

      if (!contract) {
        const config = {
          PAYMASTER_ADDRESS,
          loggerConfiguration: {
            logLevel: 'debug',
          }
        }

        let web3 = new Web3('http://localhost:8545');
        const gsnProvider = await RelayProvider.newProvider({ provider: web3.currentProvider, config }).init()
        const contract = new web3.eth.Contract(TheShouter.abi, CONTRACT_ADDRESS)
        setContract(contract);
        setProvider(gsnProvider)
        return
      }

      const maxBoardIndexResult = await contract.methods.maxBoardIndex().call({ from: account });
      const maxBoardIndex = maxBoardIndexResult.toString();

      if (!ipfs) {
        return
      }

      if (Number(maxBoardIndex) === 0) {
        return;
      }

      // ipfs fetch uri
      const boardUri = await contract.methods.tokenURI(maxBoardIndex).call({ from: account });
      console.log(boardUri)
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
      const comments = await contract.methods.queryComments(maxBoardIndex).call({ from: account });
      setCommentList(comments);
    }

    fetchData();
  }, [ipfs, contract, account]);


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
    let bytesString = '0x'
    for (let b in commentBytes) {
      let bs = String(b)
      bytesString += bs.length == 1 ? "0" + bs : bs
    }
    const tx = await contract.methods.commitComment(bytesString).send({ from: account });;

    // const commentBytes = ethers.utils.toUtf8Bytes(comment);
    // const tx = await contract.commitComment(commentBytes);
    // console.log('commit comment', tx)
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
          console.log('no contract')
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
