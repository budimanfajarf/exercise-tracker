const router = require('express').Router()
const User = require('../models/User')
const Exercise = require('../models/Exercise')

router.get('/test', (req, res) => {
  res.send('ok')
})

router.post('/new-user', async (req, res, next) => {  
  try {
    const userDoc = new User({ username: req.body.username })    
    const { _id, username } = await userDoc.save()   
    res.json({ _id, username })
  } catch (err) {
    next(err)
  }  
})

router.get('/users', async (req, res, next) => {
  try {
    const users = await User.find().select('-__v -exercises')
    res.json(users)
  } catch (err) {
    next(err)
  }
})

router.post('/add', async (req, res, next) => {
  let date
  (req.body.date) ? (date = new Date(req.body.date)) : (date = new Date())
  
  try {
    const user = await User.findById(req.body.userId)
    if (!user)
      return next({status: 400, message: 'userId not found'})
        
    const exercise = {
      description: req.body.description,
      duration: req.body.duration,    
      date,
      user: user._id
    }   
    
    const createdExercise = await Exercise.create(exercise)  
    
    user.exercises.push(createdExercise)
    await user.save()
    
    res.json(createdExercise)
  } catch(err) {
    next(err)
  }
})

router.get('/log', async (req, res, next) => {
  try {
    // const exercise = await Exercise.findById('5ecd6e772c1b5f3be49c70bf')
    // .populate('user').exec()
        
    const userId = req.query.userId
    const match = {}
    const options = {}
    
    req.query.from ? match.date = { $gte : new Date(req.query.from) }: ''
    req.query.to ? (match.date ? match.date.$lte = new Date(req.query.to) : match.date = { $lte : new Date(req.query.to) }) : ''    
    req.query.limit ? options.limit = parseInt(req.query.limit) : ''
    
    const user = await User.findById(userId)
    .select('-__v')
    .populate({
      path: 'exercises',
      select: '-_id -__v -user',
      match,
      options
    })    
    .exec()

    const response = {
      _id: user._id,
      username: user.username,
      count: user.exercises.length,
      log: user.exercises
    }
        
    res.json(response)    
  } catch (err) {
    next(err)
  }
})

module.exports = router