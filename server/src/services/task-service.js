import TaskRepo from "../repositories/task-repo.js";
import LabelRepo from '../repositories/label-repo.js';

class TaskService {
    constructor() {
        this.taskRepo = new TaskRepo();
        this.labelRepo = new LabelRepo();
    }

    async create(data) {
        try {
            const task = await this.taskRepo.create(data);
            let labels = data.labels;

            let presentLabels = await this.labelRepo.findByName(labels);
            let presentLabelTitles = presentLabels.map((label) => {
                return label.title;
            });

            let newLabels = labels.filter((label) => {
                return !presentLabelTitles.includes(label);
            });

            newLabels = newLabels.map((label) => {
                return {
                    title: label,
                    tasks: [task._id],
                    users: [task.user]
                }
            });

            await this.labelRepo.bulkCreate(newLabels);

            presentLabels.forEach(async (label) => {
                label.tasks.push(task._id);
                label.users.push(task.user);
                await label.save();
            });

            return task;
        } catch (error) {
            console.log('error at service',error);
            throw error;
        }
    }

    async getAllByUser(id) {
        try {
            const tasks = await this.taskRepo.getAllByUser(id);
            return tasks;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async delete(id) {
        try {
            const task = await this.taskRepo.getById(id);
            const labels = await this.labelRepo.findByName(task.labels);

            labels.forEach(async (label) => {
                label.users.pull(task.user);
                label.tasks.pull(task._id);
                await label.save();
                if (label.tasks.length == 0) {
                    await this.labelRepo.destroy(label._id);
                }
            });

            const response = await this.taskRepo.delete(id);
            return response;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
}

export default TaskService;