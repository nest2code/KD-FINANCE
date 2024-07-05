require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const multer = require('multer');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const mongoose = require('mongoose');
const User = require('./Schemas/User')
const Payment = require('./Schemas/Payment')
const Saving = require('./Schemas/Saving')
const LoanApplication = require('./Schemas/LoanApplication')
const Share= require('./Schemas/Schare')
const Association = require('./Schemas/Association')
const Withdrawal  = require('./Schemas/Withdraw')
const Transaction = require('./Schemas/Transaction')
const LoanPayment = require('./Schemas/LoanPayment')
const Job = require('./Schemas/Jobs')
const port = 5000;
const path = require('path');

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect('mongodb://localhost:27017/KD-financeDB')
  .then(() => {
    console.log('Connected to the database');
  })
  .catch(error => {
    console.log(error);
  });

const app = express();

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
  }));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
  });

app.use(express.json());

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: 'mongodb://localhost:27017/KD-financeDB' }),
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24,
    sameSite: 'None'
  }
}));

app.use(passport.initialize());
app.use(passport.session());


passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(async function (id, done) {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save to 'uploads/' directory
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });
app.post('/api/users/upload-photo/:userId', upload.single('photo'), async (req, res) => {
  try {
    const userId = req.params.userId; // Assuming user is authenticated
    const photoPath = req.file.path;

    // Update the user document with the photo path
    await User.findByIdAndUpdate(userId, { photo: photoPath });

    res.status(200).json({ message: 'Photo uploaded successfully', photo: photoPath });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/check-auth', (req, res) => {
    if (req.isAuthenticated()) {
      // If authenticated, return user data or a success message
      res.json({ authenticated: true, user: req.user });
    } else {
      // If not authenticated, return a failure message
      res.json({ authenticated: false });
    }
  });

app.get('/add-association',(req,res)=>{
Association.find({})
            .then(associations=>{
              res.send({assoc:associations})
            })
            .catch(error=>{
              res.send({message:"Error occured while fetching the data"})
            })

})



  app.post('/add-association', (req, res) => {
    console.log(req.body);
    const association = new Association({
      name: `Association ${req.body.name}`
    });
  
    Association.find({ name: `Association ${req.body.name}` })
      .then(assoc => {
        if (assoc.length > 0) {
          res.send({ message: "Association already exists" });
        } else {
          association.save()
            .then(() => {
              res.send({ message: "ok" });
            })
            .catch(err => {
              res.status(500).send({ message: "Error saving association", error: err });
            });
        }
      })
      .catch(err => {
        res.status(500).send({ message: "Error checking association", error: err });
      });
  });

app.put('/update-association/:id',(req,res)=>{
  const id = req.params.id
  console.log(id)
  Association.updateOne({_id:id},req.body)
              .then(association=>{
                res.send({message:"ok"})
                console.log('members added succesfully')
              })
              .catch(error=>{
                res.send({message:"Error occured try again"})
              })
})

  
app.get("/logout", function(req, res){
    req.logout(function(err) {
      if (err) {
        // Handle error
        console.error(err);
        return res.redirect("/"); // Redirect to home page
      }
      // If logout was successful, redirect to home page
      res.redirect("/login");
    });
  });
  
// Register route
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  const array = name.split(" ");
  const firstName = array[0];
  const lastName = array[1];

  try {
    const existingUser = await User.findOne({ username: email });

    if (existingUser) {
      return res.send({ message: "The account already exists!" });
    }

    const newUser = new User({ username: email, first_name: firstName, last_name: lastName });
    await User.register(newUser, password);

    req.login(newUser, (err) => {
      if (err) {
        console.log(err);
        return res.send({ message: "An error occurred while logging in. Please try again later." });
      }

      req.session.save((error) => {
        if (error) {
          console.log("Session save error: ", error);
          return res.send({ message: "An error occurred while logging in. Please try again later." });
        } else {
          console.log("Session saved successfully");
          res.send({ message: "ok" });
        }
      });
    });
  } catch (error) {
    console.log("Error during registration: ", error);
    res.send({ message: "An error occurred. Please try again later." });
  }
});

app.get('/users',(req,res)=>{

User.find({})
    .then(users=>{
      res.send({message:'ok',users:users})
    })


})


app.post('/users/share/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount } = req.body;

    const amountNum = Number(amount);

    if (isNaN(amountNum) || amountNum % 5000 !== 0) {
      return res.status(400).json({ message: 'Amount must be a multiple of 5,000' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newShare = new Share({
      user: userId,
      amount: amountNum
    });

    await newShare.save();

    user.shares.push(newShare._id);
    user.shareCapital += amountNum;
    await user.save();

    const transaction = new Transaction({
      user: userId,
      amount: amountNum,
      type: 'Bought',
      details: 'Share deposit'
    });

    await transaction.save();
    user.shareTransactions.push(transaction._id);
    await user.save();

    res.status(200).json({ message: 'ok', share: newShare });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

app.post('/users/transfer-shares/:userId', async (req, res) => {
  try {
    const fromUserId = req.params.userId;
    const { toUserId, amount } = req.body;

    const amountNum = Number(amount);

    if (isNaN(amountNum) || amountNum % 5000 !== 0) {
      return res.status(400).json({ message: 'Amount must be a multiple of 5,000' });
    }

    const fromUser = await User.findById(fromUserId).populate('shares');
    const toUser = await User.findById(toUserId);

    if (!fromUser || !toUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const totalShares = fromUser.shares.reduce((total, share) => total + share.amount, 0);

    if (totalShares < amountNum) {
      return res.status(400).json({ message: 'Insufficient shares' });
    }

    // Deduct shares from the sender
    let remainingAmount = amountNum;
    for (let i = 0; i < fromUser.shares.length; i++) {
      const share = await Share.findById(fromUser.shares[i]._id);
      if (share.amount <= remainingAmount) {
        remainingAmount -= share.amount;
        await Share.findByIdAndDelete(share._id);
        fromUser.shares.splice(i, 1);
        i--;
      } else {
        share.amount -= remainingAmount;
        await share.save();
        remainingAmount = 0;
        break;
      }
    }

    fromUser.shareCapital -= amountNum; // Update the sender's share capital
    await fromUser.save();

    // Add new share to the recipient
    const newShare = new Share({
      user: toUserId,
      amount: amountNum,
      shareDate: new Date(),
      transferFrom: fromUserId, // Indicate the source of the transfer
      association: fromUser.association // assuming the association remains the same
    });

    await newShare.save();
    toUser.shares.push(newShare._id);
    toUser.shareCapital += amountNum; // Update the recipient's share capital
    await toUser.save();

    // Log the transaction for the sender
    const senderTransaction = new Transaction({
      user: fromUserId,
      amount: -amountNum,
      type: 'Transferred',
      fromUser: fromUserId,
      toUser: toUserId,
      details: `Transferred to ${toUser.first_name} ${toUser.last_name}`
    });
    await senderTransaction.save();
    fromUser.shareTransactions.push(senderTransaction._id);
    await fromUser.save();

    // Log the transaction for the recipient
    const recipientTransaction = new Transaction({
      user: toUserId,
      amount: amountNum,
      type: 'Transferred',
      fromUser: fromUserId,
      toUser: toUserId,
      details: `Received from ${fromUser.first_name} ${fromUser.last_name}`
    });
    await recipientTransaction.save();
    toUser.shareTransactions.push(recipientTransaction._id);
    await toUser.save();

    res.status(200).json({ message: 'Shares transferred successfully' });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});




app.get('/users/view-shares/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).populate('shareTransactions');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const transactions = await Transaction.find({ user: userId })
      .populate('fromUser', 'first_name last_name')
      .populate('toUser', 'first_name last_name')
      .sort({ date: 1 }); // Sort by date ascending

    if (!transactions || transactions.length === 0) {
      return res.status(404).json({ message: 'No transactions found for user' });
    }

    let balance = 0;
    const formattedTransactions = transactions.map(transaction => {
      balance += transaction.amount;
      return {
        date: transaction.date,
        amount: transaction.amount,
        type: transaction.type,
        fromUser: transaction.fromUser ? `${transaction.fromUser.first_name} ${transaction.fromUser.last_name}` : null,
        toUser: transaction.toUser ? `${transaction.toUser.first_name} ${transaction.toUser.last_name}` : null,
        details: transaction.details,
        balance: balance // Add balance to the transaction
      };
    });
    console.log(formattedTransactions)
    res.status(200).json({ transactions: formattedTransactions, balance: user.shareCapital });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});





app.post('/update-user/:id',(req,res)=>{
  console.log(req.params.id)
const id = req.params.id;
const {fName,lName,profession,email,nin,phoneNumber,district,municipality,division,region,mission,Notification,noNotification}= req.body

  
  User.findByIdAndUpdate({_id:id},{$set:{nin_number:nin,phone_number:phoneNumber,district:district,municipality:municipality,division:division,profession:profession,mission:mission,push_notifications:Notification,push_nothing:noNotification}})
      .then(user=>{
        res.send({message:"ok"})
      })
      .catch(error=>{
        console.log('There was an error when updating the user')
      })

})

app.put('/user/:id',(req,res)=>{

const id = req.params.id;
const {association}= req.body
console.log(association)
  
  User.findByIdAndUpdate({_id:id},{$set:{association:association}})
      .then(user=>{
        res.send({message:"ok"})
      })
      .catch(error=>{
        console.log('There was an error when updating the user')
      })

})




app.get('/search/:key', async (req, res) => {
  try {
    const result = await User.find({
      "$or": [
        { first_name: { $regex: req.params.key, $options: 'i' } },
        { last_name: { $regex: req.params.key, $options: 'i' } },
        { username: { $regex: req.params.key, $options: 'i' } },
        { phone_number: { $regex: req.params.key, $options: 'i' } },
        { nin_number: { $regex: req.params.key, $options: 'i' } },
        { profession: { $regex: req.params.key, $options: 'i' } },
        // Add other fields as needed
      ]
    });
    res.send({ message: 'ok', users: result });
  } catch (error) {
    console.error('Error during search query:', error);
    res.status(500).send({ message: 'Error during search query' });
  }
});




app.get('/user/:userId',(req,res)=>{
  User.findOne({_id:req.params.userId})
      .then(user=>{
        res.send({user:user})
      })
      .catch(error=>{
        res.send({message:"Error while fetching the user"})
      })
})


app.get('/user',(req,res)=>{
  if(req.isAuthenticated()){
   res.send({user:req.user})
  }
  else{
    console.log("User not authenticated")
  }
})


app.get('/user/:id',(req,res)=>{
const id = req.params.id
if (req.isAuthenticated()){
  
  User.findOne({_id:id})
        .then(user=>{
          res.send({message:"ok",user:user})
        })
        .catch(error=>{
          res.send({message:'Error occured while fetching the data'})
        })
}
else{
  res.send({message:'Authentication error'})
}
})




app.post('/login', (req, res, next) => {
    User.findOne({ username: req.body.username })
      .then(user => {
        if (!user) {
          return res.send({ message: "User not found" });
        }
  
        if (user.status === "pending") {
          return res.send({ message: "Account not approved" });
        }
  
        passport.authenticate("local", function (err, user, info) {
          if (err) {
            return res.send({ message: "An error occurred while logging in. Please try again later." });
          }
          if (!user) {
            return res.send({ message: "Incorrect email or password." });
          }
          req.login(user, function (err) {
            if (err) {
              console.error(err);
              return res.send({ message: "An error occurred while logging in. Please try again later." });
            }
            return res.send({ message: "User logged in", user });
          });
        })(req, res, next);
      })
      .catch(error => {
        console.error(error);
        res.send({ message: "An error occurred. Please try again later." });
      });
  });


  
  // Endpoint to save money
  app.post('/users/save/:userId', async (req, res) => {
    const { userId } = req.params;
    const { amount } = req.body;
    console.log(amount)
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const amountNumber = Number(amount);
        if (isNaN(amountNumber)) {
            return res.status(400).json({ message: 'Invalid amount' });
        }

        user.savings += amountNumber;

        const newSaving = new Saving({
            user: userId,
            amount: amountNumber
        });

        await newSaving.save();
        user.savingsHistory.push(newSaving._id);
        await user.save();

        res.status(200).json({ message: 'ok' });
    } catch (error) {
        console.error('Error during deposit:', error);
        res.status(500).json({ message: 'Error occurred', error });
    }
});




app.get('/users/:userId/savings-statement', async (req, res) => {
  try {
      const { userId } = req.params;

      const user = await User.findById(userId)
          .populate({
              path: 'savingsHistory',
              model: 'Saving' // Ensure this matches your Mongoose model name 'Saving'
          })
          .populate({
              path: 'withdrawals',
              model: 'Withdrawal' // Ensure this matches your Mongoose model name 'Withdrawal'
          });

      console.log('User:', user); // Log user to inspect populated fields

      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      const transactions = [];

      // Construct transactions from savings history
      user.savingsHistory.forEach(saving => {
          transactions.push({
              date: saving.savingDate,
              type: 'Deposit',
              amount: saving.amount,
              balance: saving.amount // Assuming you calculate balance later
          });
      });

      // Construct transactions from withdrawals
      user.withdrawals.forEach(withdrawal => {
          transactions.push({
              date: withdrawal.withdrawalDate,
              type: 'Withdrawal',
              amount: -withdrawal.amount,
              balance: -withdrawal.amount // Assuming you calculate balance later
          });
      });

      // Sort transactions by date
      transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

      // Calculate balance for each transaction
      let currentBalance = 0;
      transactions.forEach(transaction => {
          currentBalance += transaction.amount;
          transaction.balance = currentBalance;
      });

      // Respond with transactions and current balance
      res.status(200).json({ transactions, balance: currentBalance });
  } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ message: 'Server error', error });
  }
});



const calculateTotalLoanAmount = (amount, interestRate) => {
  return amount * (1 + (interestRate || 0) / 100);
};



app.post('/loan-payment', async (req, res) => {
  const { userId, loanApplicationId, details, paymentAmount, paymentMode } = req.body;

  try {
    const user = await User.findById(userId);
    const loanApplication = await LoanApplication.findById(loanApplicationId);

    if (!user || !loanApplication) {
      return res.status(404).json({ error: 'User or Loan Application not found' });
    }

    // Check if the payment amount exceeds the remaining balance
    if (paymentAmount > loanApplication.balance) {
      return res.status(400).json({ error: 'Payment amount exceeds remaining balance' });
    }

    // Deduct from user's savings if payment mode is 'Saving'
    if (paymentMode === 'Saving') {
      if (user.savings < paymentAmount) {
        return res.status(400).json({ error: 'Insufficient savings' });
      }

      // Deduct from user's savings
      user.savings -= paymentAmount;
      await user.save();

      // Record withdrawal
      const withdrawal = new Withdrawal({
        user: userId,
        amount: paymentAmount,
        association: user.association,
        withdrawalDate: new Date()
      });
      await withdrawal.save();

      // Add withdrawal ID to user's withdrawals array
      user.withdrawals.push(withdrawal._id);
      await user.save();  // Save the updated user document
    }

    // Calculate new balance
    const newBalance = loanApplication.balance - paymentAmount;

    // Update loan application balance
    loanApplication.balance = newBalance;
    await loanApplication.save();

    // Create loan payment record
    const loanPayment = new LoanPayment({
      loanApplication: loanApplicationId,
      paymentAmount,
      details,
      paymentDate: new Date(),
      paymentMode,
      balance: newBalance
    });
    await loanPayment.save();

    res.status(201).json({ message: 'Loan payment successful', loanPayment });
  } catch (error) {
    console.error('Error processing loan payment:', error.message);
    res.status(500).json({ error: 'Failed to process loan payment' });
  }
});




// GET loan payments and details for a specific loan and user
app.get('/loan-payments/:userId/:loanId', async (req, res) => {
  const { userId, loanId } = req.params;

  try {
    const loan = await LoanApplication.findOne({ _id: loanId, user: userId });

    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    const payments = await LoanPayment.find({ loanApplication: loanId });

    // Calculate total paid amount
    const totalPaid = payments.reduce((acc, payment) => acc + payment.paymentAmount, 0);

    // Calculate total loan amount with interest
    const totalLoanAmount = calculateTotalLoanAmount(loan.amount, loan.interestRate);

    // Calculate remaining balance
    const remainingBalance = totalLoanAmount - totalPaid;

    // Update loan balance if it's different from remaining balance in database
    if (loan.balance !== remainingBalance) {
      loan.balance = remainingBalance;
      await loan.save();
    }

    res.status(200).json({ loan, payments, totalPaid, remainingBalance });
  } catch (error) {
    console.error('Error fetching loan payments:', error.message);
    res.status(500).json({ error: 'Failed to fetch loan payments' });
  }
});


app.post('/users/:userId/withdraw', async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount } = req.body;

    // Convert amount to a number
    const amountNumber = Number(amount);

    if (isNaN(amountNumber) || amountNumber <= 0) {
      return res.status(400).json({ message: 'Amount must be a number greater than 0' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.savings < amountNumber) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Create a new withdrawal
    const withdrawal = new Withdrawal({
      user: user._id,
      amount: amountNumber,
      association: user.association
    });

    await withdrawal.save();

    // Update user's savings and push the withdrawal ID
    user.savings -= amountNumber;
    user.withdrawals.push(withdrawal._id);

    await user.save();

    res.status(200).json({ message: 'Withdrawal successful', savings: user.savings });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});




// Endpoint to withdraw money
app.post('/users/:userId/withdraw', async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount } = req.body;

    // Convert amount to a number
    const amountNumber = Number(amount);

    if (isNaN(amountNumber) || amountNumber <= 0) {
      return res.status(400).json({ message: 'Amount must be a number greater than 0' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.savings < amountNumber) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Deduct from user's savings
    user.savings -= amountNumber;
    await user.save();

    // Create a new withdrawal record
    const withdrawal = new Withdrawal({
      user: user._id,
      amount: amountNumber,
      association: user.association,
      withdrawalDate: new Date()  // Optionally, capture the withdrawal date
    });

    await withdrawal.save();

    res.status(200).json({ message: 'Withdrawal successful', savings: user.savings });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

//Loan application 

const calculateEndDate = (startDate, durationInMonths) => {
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + durationInMonths);
  return endDate;
};

app.post('/loan-application/:userId', async (req, res) => {
  const { userId } = req.params;
  const { amount, interestRate, duration } = req.body;

  try {
      // Fetch user details including association
      const user = await User.findById(userId);

      if (!user) {
          return res.status(404).json({ error: 'User not found' });
      }

      // Create loan application
      const loanApplication = new LoanApplication({
          user: userId,
          amount: parseFloat(amount),
          interestRate: parseFloat(interestRate),
          duration: parseInt(duration, 10),
          association: user.association, // Set association from user data
          startDate: new Date(), // Automatically set start date to current date
          endDate: calculateEndDate(new Date(), parseInt(duration, 10)) // Calculate end date based on duration
      });

      // Save loan application
      await loanApplication.save();

      res.status(201).json({ message: 'Loan application submitted successfully.', loanApplication });
  } catch (error) {
      console.error('Error submitting loan application:', error.message);
      res.status(500).json({ error: 'Failed to submit loan application' });
  }
});




app.put('/update-loan/:loanId', async (req, res) => {
  try {
    const loanId = req.params.loanId;

    // Validate loanId
    if (!mongoose.Types.ObjectId.isValid(loanId)) {
      return res.status(400).json({ message: 'Invalid loan ID' });
    }

    // Update loan status and start date
    const result = await LoanApplication.updateOne(
      { _id: loanId },
      { $set: { status: "Approved", startDate: new Date(),endDate: calculateEndDate(new Date(), parseInt(duration, 10)) } }
    );

    if (result.nModified === 0) {
      return res.status(404).json({ message: "Loan not found or already approved" });
    }

    res.status(200).json({ message: "Loan Approved successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to approve the loan", error: err.message });
  }
});



app.put('/update-user/:id', async (req, res) => {
  try {
    const {id}= req.params;
   
    // Validate user
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Update user status and start date
    const result = await User.updateOne(
      { _id: id },
      { $set: { status: "Approved"} }
    );

    if (result.nModified === 0) {
      return res.status(404).json({ message: "Loan not found or already approved" });
    }

    res.status(200).json({ message: "user Approved successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to approve the user", error: err.message });
  }
});


app.get('/loans/:userId', async (req, res) => {
  const { userId } = req.params;
  console.log(userId)
  try {
      // Fetch loan applications for the user
      const loans = await LoanApplication.find({ user: userId })
                                       .populate('association') // Optionally populate association details
                                       .exec();

      res.status(200).json(loans);
  } catch (error) {
      console.error('Error fetching loans:', error.message);
      res.status(500).json({ error: 'Failed to fetch loans' });
  }
});

  
app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
