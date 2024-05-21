 const { getNamedAccounts, ethers } = require("hardhat");
const { getWeth,AMOUNT} = require("../scripts/getWeth.js");
 
 
 async function main()
 {
    await getWeth();
    const { deployer } = await getNamedAccounts();
    //abi,addresses

    //Lending pool Address Provider : 0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5
    //Lending Pool: ^

    const lendingPool = await getLendingPool(deployer);
    console.log(`LendingPool address ${lendingPool.address}`);

    //deposit
    const wethTokenAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    //approve
    await approveErc20(
        wethTokenAddress,
        lendingPool.address,
        AMOUNT,
        deployer
    )
    console.log("Depositing...");

    await lendingPool.deposit(wethTokenAddress,AMOUNT,deployer,0);

    console.log("Deposited");

    let {availableBorrowsETH,totalDebtETH} = await getBorrowUserData(
        lendingPool,
        deployer
    )
    const daiPrice = await getDaiPrice();
    const amountDaiToBorrow = availableBorrowsETH.toString() * 0.95 * (1/daiPrice.toNumber());
    console.log(`You can borrow ${amountDaiToBorrow} DAI`);
    const amountDaiToBorrowWei = ethers.utils.parseEther(
        amountDaiToBorrow.toString()
    )
    //availableBorrowsETH? What the conversion rate on DAI is?
    //Borrow Time!
    //how much we have borrwed, how much we have in collateral, how much we can borrow 


    const daiTokenAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    await borrowDai(
        daiTokenAddress ,
        lendingPool,
        amountDaiToBorrowWei,
        deployer

    );
    await getBorrowUserData(lendingPool,deployer);
    await repay(amountDaiToBorrowWei,daiTokenAddress,lendingPool,deployer);
    await getBorrowUserData(lendingPool,deployer);
    
 }



 async function getDaiPrice() {
    const daiEthPriceFeed = await ethers.getContractAt(
        "AggregatorV3Interface",
        "0x773616E4d11A78F511299002da57A0a94577F1f4"
    )
    const price = (await daiEthPriceFeed.latestRoundData())[1]
    console.log(`The DAI/ETH is ${price.toString()}`);
    return price;
 }



 async function repay(amount, daiAddress,lendingPool,account)
 {
    await approveErc20(daiAddress,lendingPool.address,amount,account);
    const repayTx = await lendingPool.repay(daiAddress,amount,2,account);
    await repayTx.wait(1);
    console.log("Repaid");
 }




 async function borrowDai(
    daiAddress,
    lendingPool,
    amountDaiToBorrowWei,
    account
 ){
    const borrowTx = await lendingPool.borrow(
        daiAddress,
        amountDaiToBorrowWei,
        2,
        0,
        account
    )
    await borrowTx.wait(1);
    console.log("You have borrowed!");
 }








 async function getBorrowUserData(lendingPool,account){
    const {totalCollateralETH, totalDebtETH, availableBorrowsETH} = 
    await lendingPool.getUserAccountData(account);
    console.log(`You have ${totalCollateralETH} worth of ETH deposited`);
    console.log(`You have ${totalDebtETH} worth of ETH borrowed`);
    console.log(`You can  ${availableBorrowsETH} worth of ETH borrowed`);
    return {availableBorrowsETH,totalDebtETH};
 }



 async function getLendingPool(account)
 {
    const lendingPoolAddressesProvider = await ethers.getContractAt(
        "ILendingPoolAddressesProvider",
        "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
        account
    )
    const lendingPoolAddress = await lendingPoolAddressesProvider.getLendingPool();
    const lendingPool = await ethers.getContractAt(
        "ILendingPool",
        lendingPoolAddress,
        account
    )
    return lendingPool;
 }

 async function approveErc20(erc20Address, spenderAddress, amountToSpend, account){
    const erc20Token = await ethers.getContractAt(
        "IERC20",erc20Address,account
    );
    const tx = await erc20Token.approve(spenderAddress,amountToSpend);
    await tx.wait(1);
    console.log("Approved!");
 }



 main()
 .then(() => process.exit(0))
 .catch(error => {
     console.error(error)
     process.exit(1)
 })