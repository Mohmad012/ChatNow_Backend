import express from 'express';
import { Test } from "../controller/test.controller.js"

const router = express.Router();

router.get('/' , Test)

export default router;