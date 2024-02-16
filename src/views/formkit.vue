<template>
    <div>
      <h1>FormKit</h1>
      <form @submit.prevent="submit">
        <div>
          <label for="name">Name</label>
          <input type="text" id="name" v-model="form.name">
        </div>
        <div>
          <label for="email">Email</label>
          <input type="email" id="email" v-model="form.email">
        </div>
        <div>
          <label for="password">Password</label>
          <input type="password" id="password" v-model="form.password">
        </div>
        <div>
          <label for="confirmPassword">Confirm Password</label>
          <input type="password" id="confirmPassword" v-model="form.confirmPassword">
        </div>
        <div>
          <label for="fullRobot">Full Robot Image</label>
          <input type="file" id="fullRobot" ref="fullRobot" @change="uploadFullRobot">
        </div>
        <div>
          <label for="driveTrain">Drive Train Image</label>
          <input type="file" id="driveTrain" ref="driveTrain" @change="uploadDriveTrain">
        </div>
        <div>
          <button type="submit">Submit</button>
        </div>
      </form>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    name: 'FormKit',
    data() {
      return {
        form: {
          name: '',
          email: '',
          password: '',
          confirmPassword: ''
        }
      }
    },
    methods: {
      uploadFullRobot() {
        const file = this.$refs.fullRobot.files[0];
        this.uploadFile(file, 'full_robot');
      },
      uploadDriveTrain() {
        const file = this.$refs.driveTrain.files[0];
        this.uploadFile(file, 'drive_train');
      },
      uploadFile(file, type) {
        const formData = new FormData();
        formData.append('file', file);
        axios.post(`http://localhost:3000/upload?type=${type}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        .then(response => {
          console.log('File uploaded successfully', response);
        })
        .catch(error => {
          console.error('Error uploading file', error);
        });
      },
      submit() {
        console.log(this.form);
        // Handle other form fields submission logic here
      }
    }
  }
  </script>
  
  <style scoped>
  
  </style>
  