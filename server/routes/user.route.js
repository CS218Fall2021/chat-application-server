const router = express.Router();


router
  .route('/')
  .get(authorize(ADMIN), validate(listUsers), controller.list)
  .post(authorize(ADMIN), validate(createUser), controller.create);