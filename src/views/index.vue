<template>
  <el-form ref="form" label-width="120px">
    <h3>Form</h3>

    <el-form-item label="Event">
      <el-input v-model="form.event"></el-input>
    </el-form-item>

    <el-form-item label="Team Number">
      <el-input-number v-model="form.teamNumber" :min="0"></el-input-number>
    </el-form-item>

    <el-form-item label="Drive Train Type">
      <el-radio-group v-model="form.driveTrainType">
        <el-radio label="Tank Drive"></el-radio>
        <el-radio label="Mecanum"></el-radio>
        <el-radio label="Omni"></el-radio>
        <el-radio label="Other"></el-radio>
      </el-radio-group>
    </el-form-item>

    <el-form-item label="Wheel Type">
      <el-radio-group v-model="form.wheelType">
        <el-radio label="Traction"></el-radio>
        <el-radio label="Mecanum"></el-radio>
        <el-radio label="Omni"></el-radio>
        <el-radio label="Other"></el-radio>
      </el-radio-group>
    </el-form-item>

    <el-form-item label="Intake Use">
      <el-radio-group v-model="form.intakeUse">
        <el-radio label="Ground"></el-radio>
        <el-radio label="Station"></el-radio>
        <el-radio label="Other"></el-radio>
      </el-radio-group>
    </el-form-item>

    <el-form-item label="Scoring Locations">
      <el-checkbox-group v-model="form.scoringLocations">
        <el-checkbox label="Amp"></el-checkbox>
        <el-checkbox label="Speaker"></el-checkbox>
        <el-checkbox label="Trap"></el-checkbox>
        <el-checkbox label="Balance"></el-checkbox>
      </el-checkbox-group>
    </el-form-item>


    <!-- ...... -->

    <el-form-item label="Robot Weight">
      <el-input-number v-model="form.robotWeight" :min="0"></el-input-number>
    </el-form-item>

    <el-form-item label="Robot Length">
      <el-input-number v-model="form.robotLength" :min="0"></el-input-number>
    </el-form-item>

    <el-form-item label="Robot Width">
      <el-input-number v-model="form.robotWidth" :min="0"></el-input-number>
    </el-form-item>

    <el-form-item label="Robot Height">
      <el-input-number v-model="form.robotHeight" :min="0"></el-input-number>
    </el-form-item>


    <!-- NEED TO FIX!!!!!!! -->
    <el-form-item label="Drive Team Members">
      <el-input type="textarea" v-model="form.driveTeamMembers"></el-input>
      <!-- <el-input type="textarea" v-model="form.driveTeamMembers"></el-input> -->
    </el-form-item>

    <el-form-item label="Practice Hours">
      <el-input-number v-model="form.practiceHours" :min="0"></el-input-number>
    </el-form-item>

    <!-- ...... -->


    <el-form-item label="Picture - Full Robot">
      <el-upload class="upload-demo" drag action="http://localhost:3000/upload?type=full_robot"
        :on-success="handleSuccess" :on-remove="handleRemove" :file-list="fileList.fullRobot">
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">Drag files here or <em>click to upload</em></div>
      </el-upload>
    </el-form-item>

    <el-form-item label="Picture - Drive Train">
      <el-upload class="upload-demo" drag action="http://localhost:3000/upload?type=drive_train"
        :on-success="handleSuccess" :on-remove="handleRemove" :file-list="fileList.driveTrain">
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">Drag files here or <em>click to upload</em></div>
      </el-upload>
    </el-form-item>

    <el-form-item label="Additional Comments">
      <el-input type="textarea" v-model="form.additionalComments"></el-input>
    </el-form-item>

    <el-button type="primary" @click="submitForm">Submit</el-button>
  </el-form>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      form:[
        { question: 'Event', type: 'text',value:null },
        { question: 'Team number', type: 'number', value:null},
        { question: 'Type of drive train', type: 'radio', options: ['Tank Drive ("skid steer", plates on both sides of wheels)', 'West Coast Drive (wheels mounted off one side of tube)', 'Swerve Drive','Other: '], value:null },
        { question: 'Type of wheels used', type: 'radio', options: ["Traction","Mecanum (rollers at 45° angle)","Omni (rollers at 90° angle)","Other: "], value:null },
        { question: 'Intake Use:', type: 'radio', options: ["Ground","Station","Other: "], value:null},
        { question: 'Scoring Locations:', type: 'checkbox', options: ["Amp","Speaker","Trap","Balance"], value:null},
        { question: 'Robot Weight', type: 'number', value:null},
        { question: 'Robot Dimension (Length in Inches) without bumpers - front to back', type: 'number', value:null },
        { question: 'Robot Dimension (Width in Inches) without bumpers - left to right', type: 'number', value:null},
        { question: 'Robot Dimension (Height in Inches) from floor to highest point on robot at the start of the match', type: 'number', value:null},
        { question: 'Drive Team Members', type: 'radio', options: ["One person driving and operating the robot during a match","Other: "], value:null },
        { question: 'Hours/Weeks of Practice', type: 'text',value:null },
        { question: 'Picture - Full Robot', type: 'file',value:null,fileId:[] },
        { question: 'Picture - Drive Train', type: 'file',value:null,fileId:[] },
        { question: 'Additional Comments', type: 'textarea',value:null }
      ],
      fileList : this.form.filter(item => item.type === 'file')
    };
  },
  methods: {
    submitForm() {
      this.$refs.form.validate(async (valid) => {
        if (valid) {
          try {
            // Initialize FormData for sending form data and files
            let formData = new FormData();
            formData.append('event', this.form.event);
            formData.append('teamNumber', this.form.teamNumber);
            // Another stuff.....
            formData.append('additionalComments', this.form.additionalComments);

            // Upload images
            this.fileList.fullRobot.forEach(file => {
              formData.append('fullRobotImages', file.raw);
            });
            this.fileList.driveTrain.forEach(file => {
              formData.append('driveTrainImages', file.raw);
            });

            // Post form data & files to Back-End server
            await axios.post('http://localhost:3000/submit-form', formData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            });
            // After form is submitted, message will displayed
            this.$message.success('Form submitted successfully');
          } catch (error) {
            console.error('Error submitting form:', error);
            this.$message.error('Error submitting form');
          }
        }
      });
    },
    handleSuccess(response, file, fileList) {
      console.log('Upload successful:', response);

      // 更新fileList以包含文件ID
      // const index = fileList.indexOf(file);
      if (response && response.fileId) {
        if (fileList === this.fileList.fullRobot) {
          this.fileIds.fullRobot.push(response.fileId);
        } else if (fileList === this.fileList.driveTrain) {
          this.fileIds.driveTrain.push(response.fileId);
        }
      }
      if (index !== -1) {
        // 确保文件对象包含文件ID
        fileList[index].fileId = fileId;
      }
    },
    handleRemove(file, fileList) {
      console.log('File removed:', file);

      // 替换为实际的文件ID属性
      const fileId = file.fileId;

      if (!fileId) {
        console.error('File ID is missing, cannot delete the file.');
        return;
      }
      axios.get(`http://localhost:3000/delete?file_ID=${fileId}`)
        .then(response => {
          console.log('File deletion response:', response.data);
          // 可以在这里进行进一步的操作，如更新状态或通知用户
          // 从fileList中移除已删除的文件
          this.fileList = fileList.filter(f => f.fileId !== fileId);
        })
        .catch(error => {
          console.error('Error deleting the file:', error);
          // 错误处理，如显示错误消息
        });
    }
  }
};
</script>
