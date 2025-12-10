import faker from 'faker';

import User from '../models/user.model.js';

export async function userSeed(count) {
  try {
    const users = [];

    Array.from({ length: count || 10 }).map(() => {
      const fakeUser = {
        name: `${faker.name.firstName()} ${faker.name.lastName()}`,
        username: faker.internet.userName(),
        email: faker.internet.email().toLowerCase(),
        password: 'password1',
        mobile_number: faker.phone.phoneNumber(),
        user_fname: faker.name.firstName(),
        school_name: faker.company.companyName(),
        setup_id: faker.random.number({ min: 100, max: 999 }),
        board: faker.random.arrayElement(['CBSE', 'ICSE', 'State Board']),
        class_name: faker.random.arrayElement(['10th', '11th', '12th']),
        dept_id: faker.random.number({ min: 1, max: 20 }),
        subject: faker.random.arrayElement(['Math', 'Science', 'History']),
        subject_id: faker.random.number({ min: 1, max: 50 }),
        medium: faker.random.arrayElement([1, 2]), // 1 for English, 2 for Hindi
      };
      return users.push(fakeUser);
    });
    
    // Sequelize bulkCreate for efficiency
    const savedUsers = await User.bulkCreate(users, { individualHooks: true });
    return savedUsers;
  } catch (error) {
    console.log('User Seed Error:', error);
    return error;
  }
}

export async function deleteUserSeed() {
  try {
    // Sequelize destroy - truncates the table
    return await User.destroy({ where: {}, truncate: true });
  } catch (e) {
    return e;
  }
}
