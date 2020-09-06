import { db } from '../models/index.js';
import { logger } from '../config/logger.js';

const Student = db.student;

const create = async (req, res) => {
  try {
    const student = new Student({
      name: req.body.name,
      subject: req.body.subject,
      type: req.body.type,
      value: req.body.value,
    });
    const data = await student.save();
    res.send({ data: data, message: 'Grade added sucessfully' });
    logger.info(`POST /grade - ${JSON.stringify()}`);
  } catch (error) {
    res.status(500).send({
      message: error.message || 'An error occurred when saving new grade',
    });
    logger.error(`POST /grade - ${JSON.stringify(error.message)}`);
  }
};

const findAll = async (req, res) => {
  const name = req.query.name;

  //condicao para o filtro no findAll
  let condition = name
    ? { name: { $regex: new RegExp(name), $options: 'i' } }
    : {};

  try {
    const data = await Student.find(condition);
    if (!data) {
      res.status(404).send('Grades not found');
    }
    res.send({ data: data, message: 'Grades founds succesfully' });
    logger.info(`GET /grade`);
  } catch (error) {
    res.status(500).send({
      message: error.message || 'Error when trying to list all grades',
    });
    logger.error(`GET /grade - ${JSON.stringify(error.message)}`);
  }
};

const findOne = async (req, res) => {
  const id = req.params.id;

  try {
    const data = await Student.findById({ _id: id });
    if (!data) {
      res.status(404).send('Grades not found');
    }
    res.send({ data: data, message: 'Grade found succesfully' });
    logger.info(`GET /grade - ${id}`);
  } catch (error) {
    res.status(500).send({ message: 'Error when searching Grade id: ' + id });
    logger.error(`GET /grade - ${JSON.stringify(error.message)}`);
  }
};

const update = async (req, res) => {
  if (!req.body) {
    return res.status(400).send({
      message: 'Empty data received to update entry',
    });
  }

  const id = req.params.id;
  const { name, subject, type, value } = req.body;

  try {
    const data = Student.findByIdAndUpdate(
      { _id: id },
      { name, subject, type, value },
      {
        new: true,
      }
    );
    if (!data) {
      res.status(404).send('Grade with id:' + id, ' not found');
    }
    res.send({ data: data, message: 'Grade updated succesfully' });
    logger.info(`PUT /grade - ${id} - ${JSON.stringify(req.body)}`);
  } catch (error) {
    res.status(500).send({ message: 'Error when updating grade id: ' + id });
    logger.error(`PUT /grade - ${JSON.stringify(error.message)}`);
  }
};

const remove = async (req, res) => {
  const id = req.params.id;

  try {
    const data = await Student.findByIdAndRemove({ _id: id });
    if (!data) {
      res.status(404).send('Grade with id:' + id, ' not found');
    }
    res.send({ message: 'Grade deleted succesfully' });
    logger.info(`DELETE /grade - ${id}`);
  } catch (error) {
    res
      .status(500)
      .send({ message: 'Error when trying to delete grade id: ' + id });
    logger.error(`DELETE /grade - ${JSON.stringify(error.message)}`);
  }
};

const removeAll = async (_, res) => {
  try {
    const data = await Student.deleteMany();
    if (!data) {
      res.status(404).send('No grades found to delete');
    }
    res.send({ message: 'All grades deleted succesfully' });
    logger.info(`DELETE /grade`);
  } catch (error) {
    res.status(500).send({ message: 'Error when trying to delete all grades' });
    logger.error(`DELETE /grade - ${JSON.stringify(error.message)}`);
  }
};

export default { create, findAll, findOne, update, remove, removeAll };
