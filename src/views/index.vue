<template>
  <el-form ref="form" label-width="120px">
    <h3>Form</h3>
    <el-form-item v-for="x of inputs" :key="x.question" label="x.question">
      <el-input v-if="x.type==='text'" v-model="x.value" required></el-input>
      <el-input v-else-if="x.type==='number'" v-model="x.value" pattern="^\d+(\s\d+\/\d+)?(\.\d+)?$|^\d+\/\d+$" title="Valid forms: _ , _._ , n/d , _ n/d" required></el-input>
      <el-radio-group v-else-if="x.type==='radio'" v-model="x.value" required>
        <el-radio v-for="option of x.options" :key="option" label="option"></el-radio>
      </el-radio-group>
      <el-checkbox-group v-else-if="x.type==='checkbox'" v-model="x.value">
        <el-checkbox v-for="option of x.options" :key="option" label="option"></el-checkbox>
      </el-checkbox-group>
      <!-- wrong:<el-input v-else-if="x.type==='select'" v-model="x.value" required></el-input>-->
      <el-input v-else-if="x.type==='textarea'" type="textarea" v-model="x.value" required></el-input>
      <el-upload v-else-if="x.type==='file'" v-model="x.value" class="upload-demo" drag action="x.action" :on-success="handleSuccess" :on-remove="handleRemove" :file-list="fileList.fullRobot" required>
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">Drag files here or <em>click to upload</em></div>
      </el-upload>
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
        { question: 'Picture - Full Robot', type: 'file',value:null,fileId:[],action:null },
        { question: 'Picture - Drive Train', type: 'file',value:null,fileId:[],action:null},
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
            //set the values
            for(let i of this.form){
              if(i.type==="file"){formData.append(i.question, i.value.raw);}
              else{formData.append(i.question, i.value);}
            }
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
    //not going to work after I changed the data types
    /*handleSuccess(response, file, fileList) {
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
    },*/
    //this probably won't work either
    /*handleRemove(file, fileList) {
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
    }*/
  }
};
</script>
