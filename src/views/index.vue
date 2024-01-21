<template>
  <el-form ref="form" label-width="120px" label-position="top">
    <h3>Form</h3>

    <el-button type="danger" @click="clearForm">Clear Form</el-button>

    <el-form-item v-for="x of form" :key="x.question" :label="x.required ? `${x.question}` : x.question"
      :required="x.required" :rules="[{ required: x.required, message: 'This field is required', trigger: 'blur' }]">
      <el-input v-if="x.type === 'text'" v-model="x.value" required></el-input>
      <el-input v-else-if="x.type === 'number'" v-model="x.value" pattern="^\d+(\s\d+\/\d+)?(\.\d+)?$|^\d+\/\d+$"
        title="Valid forms: _ , _._ , n/d , _ n/d" required></el-input>

      <el-radio-group v-else-if="x.type === 'radio'" v-model="x.value" required class="vertical-layout"
        @change="handleRadioChange(x, $event)">
        <el-radio v-for="option in x.options" :key="option" :label="option">{{
          option
        }}</el-radio>
        <el-radio label="other"></el-radio>
        <el-input v-if="x.showOtherInput" v-model="x.otherValue" :rows="3" type="textarea"
          placeholder="Please input"></el-input>
      </el-radio-group>

      <el-checkbox-group v-else-if="x.type === 'checkbox'" v-model="x.value" @change="handleCheckboxChange(x, $event)"
        class="vertical-layout">
        <el-checkbox v-for="option in x.options" :key="option" :label="option">{{ option }}</el-checkbox>
        <el-checkbox label="other"></el-checkbox>
        <el-input v-if="x.showOtherInput" v-model="x.otherValue" :rows="3" placeholder="Please input"></el-input>
        <el-input v-else-if="x.type === 'number'" v-model="x.value" required></el-input>
      </el-checkbox-group>

      <!-- wrong:<el-input v-else-if="x.type==='select'" v-model="x.value" required></el-input>-->
      <el-input v-else-if="x.type === 'textarea'" type="textarea" v-model="x.value" required></el-input>
    </el-form-item>
    <!-- ...... -->

    <el-form-item label="Picture - Full Robot">
      <el-upload class="upload-demo" drag action="http://localhost:3000/upload?type=full_robot"
        :on-success="handleSuccess" :on-remove="handleRemove" :file-list="fileList.fullRobot">
        <el-icon :size="50" color="#b3b3b3">
          <upload />
        </el-icon>
        <div class="el-upload__text">
          Drag files here or <em>click to upload</em>
        </div>
      </el-upload>
    </el-form-item>

    <el-form-item label="Picture - Drive Train">
      <el-upload class="upload-demo" drag action="http://localhost:3000/upload?type=drive_train"
        :on-success="handleSuccess" :on-remove="handleRemove" :file-list="fileList.driveTrain">
        <el-icon :size="50" color="#b3b3b3">
          <upload />
        </el-icon>
        <div class="el-upload__text">
          Drag files here or <em>click to upload</em>
        </div>
      </el-upload>
    </el-form-item>
    <el-button type="primary" @click="submitForm">Submit</el-button>
  </el-form>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      form: [
        {
          question: "Event",
          type: "text",
          required: true,
          value: null,
        },
        {
          question: "Team number",
          type: "number",
          required: true,
          value: null,
        },
        {
          question: "Type of drive train",
          type: "radio",
          options: [
            'Tank Drive ("skid steer", plates on both sides of wheels)',
            "West Coast Drive (wheels mounted off one side of tube)",
            "Swerve Drive",
          ],
          value: null,
          required: true,
          showOtherInput: false, // show the textarea when first load the page?
          otherValue: "", // Store the value of the text input
        },
        {
          question: "Type of wheels used",
          type: "radio",
          options: [
            "Traction",
            "Mecanum (rollers at 45° angle)",
            "Omni (rollers at 90° angle)",
          ],
          value: null,
          required: true,
          showOtherInput: false, // show the textarea when first load the page?
          otherValue: "", // Store the value of the text input
        },
        {
          question: "Intake Use:",
          type: "radio",
          options: ["Ground", "Station"],
          value: null,
          required: true,
          showOtherInput: false, // show the textarea when first load the page?
          otherValue: "", // Store the value of the text input
        },
        {
          question: "Scoring Locations:",
          type: "checkbox",
          options: ["Amp", "Speaker", "Trap", "Balance"],
          value: [], // should be an array if it's a checkbox
          required: true,
          showOtherInput: false, // show the textarea when first load the page?
          otherValue: "", // Store the value of the text input
        },
        {
          question: "Robot Weight",
          type: "number",
          required: true,
          value: null,
        },
        {
          question:
            "Robot Dimension (Length in Inches) without bumpers - front to back",
          type: "number",
          required: true,
          value: null,
        },
        {
          question:
            "Robot Dimension (Width in Inches) without bumpers - left to right",
          type: "number",
          required: true,
          value: null,
        },
        {
          question:
            "Robot Dimension (Height in Inches) from floor to highest point on robot at the start of the match",
          type: "number",
          required: true,
          value: null,
        },
        {
          question: "Drive Team Members",
          type: "radio",
          options: [
            "One person driving and operating the robot during a match",
          ],
          value: null,
          required: true,
          showOtherInput: false, // show the textarea when first load the page?
        },
        {
          question: "Hours/Weeks of Practice",
          type: "text",
          required: true,
          value: null,
        },
        {
          question: "Additional Comments",
          type: "textarea",
          required: false,
          value: null,
        },
      ],
      // fileList : this.form.filter(item => item.type === 'file').map(item => item.value)
      fileList: {
        fullRobot: [],
        driveTrain: [],
      },
      // Requcored for uploading files ID
      fileIds: {
        fullRobot: [],
        driveTrain: [],
      },
      textarea: "",
      computed: {
        fileList() {
          return this.form.filter((item) => item.type === "file");
        },
      },
    };
  },

  created() {
    this.restoreFormData();
  },

  watch: {
    form: {
      handler(newForm) {
        newForm.forEach((question) => {
          if (question.type === "checkbox") {
            localStorage.setItem(
              question.question,
              JSON.stringify(question.value)
            );
          } else {
            localStorage.setItem(question.question, question.value);
          }

          localStorage.setItem(
            question.question + "-otherValue",
            question.otherValue
          );
        });
      },
      deep: true,
    },
  },

  methods: {
    handleRadioChange(question, value) {
      question.showOtherInput = value === "other";
    },
    handleCheckboxChange(question, values) {
      question.showOtherInput = values.includes("other");
    },
    mounted() {
      // Check if the form has been saved before
      this.form.forEach((question) => {
        if (question.type === "radio" && question.value === "other") {
          question.showOtherInput = true;
        }
        if (question.type === "checkbox" && question.value.includes("other")) {
          question.showOtherInput = true;
        }
      });
    },

    restoreFormData() {
      this.form.forEach((question) => {
        try {
          // 对于普通值
          const savedValue = localStorage.getItem(question.question);
          if (savedValue && savedValue !== "null") {
            question.value = savedValue;
          }

          // 对于 'otherValue'
          const otherValue = localStorage.getItem(
            question.question + "-otherValue"
          );
          if (otherValue && otherValue !== "null") {
            question.otherValue = otherValue;
          }

          // 对于 checkbox 类型，确保值是数组
          if (question.type === "checkbox" && savedValue) {
            question.value = JSON.parse(savedValue);
          }

          // 更新 showOtherInput 状态
          if (
            (question.type === "radio" && question.value === "other") ||
            (question.type === "checkbox" && question.value.includes("other"))
          ) {
            question.showOtherInput = true;
          }
        } catch (error) {
          console.error("Error restoring form data:", error);
        }
      });
    },

    clearForm() {
      this.$confirm('Are you sure you want to clear the form?', 'Warning', {
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
        type: 'warning'
      }).then(() => {
        this.resetFormData();
        this.$message({
          type: 'success',
          message: 'Form has been cleared!'
        });
      }).catch(() => {
        this.$message({
          type: 'info',
          message: 'Clear canceled'
        });
      });
    },

    resetFormData() {
      this.form.forEach(question => {
        if (question.type === 'checkbox') {
          question.value = [];
        } else {
          question.value = null;
        }
        question.showOtherInput = false;
        question.otherValue = '';
      });
    },

    submitForm() {
      this.$refs.form.validate(async (valid) => {
        if (valid) {
          try {
            // Initialize FormData for sending form data and files
            let formData = new FormData();
            formData.append("event", this.form.event);
            formData.append("teamNumber", this.form.teamNumber);
            // Another stuff.....
            formData.append("additionalComments", this.form.additionalComments);

            // Upload images
            this.fileList.fullRobot.forEach((file) => {
              formData.append("fullRobotImages", file.raw);
            });
            this.fileList.driveTrain.forEach((file) => {
              formData.append("driveTrainImages", file.raw);
            });

            // Post form data & files to Back-End server
            await axios.post("http://localhost:3000/submit-form", formData, {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            });
            // After form is submitted, message will displayed
            this.$message.success("Form submitted successfully");
          } catch (error) {
            console.error("Error submitting form:", error);
            this.$message.error("Error submitting form");
          }
        }
      });
    },
    handleSuccess(response, file, fileList) {
      console.log("Upload successful:", response);
      // Check if the response contains the fileId
      if (response && response.fileId) {
        // Find the matching file object in the fileList and update it directly
        const index = fileList.findIndex((f) => f.uid === file.uid);
        if (index !== -1) {
          // Update the file object to include the fileId
          fileList[index] = { ...fileList[index], fileId: response.fileId };
        }

        // According to the different upload types, store the file ID in the corresponding array
        if (fileList === this.fileList.fullRobot) {
          this.fileIds.fullRobot.push(response.fileId);
        } else if (fileList === this.fileList.driveTrain) {
          this.fileIds.driveTrain.push(response.fileId);
        }
      } else {
        console.error("No fileId returned from the server");
      }
    },
    handleRemove(file, fileList) {
      console.log("File removed:", file);

      const fileId = file.fileId;
      if (!fileId) {
        console.error("File ID is missing, cannot delete the file.");
        return;
      }

      axios
        .get(`http://localhost:3000/delete?file_ID=${fileId}`)
        .then((response) => {
          console.log("File deletion response:", response.data);
          // Update fileIds array, remove the deleted fileId
          if (fileList === this.fileList.fullRobot) {
            this.fileIds.fullRobot = this.fileIds.fullRobot.filter(
              (id) => id !== fileId
            );
          } else if (fileList === this.fileList.driveTrain) {
            this.fileIds.driveTrain = this.fileIds.driveTrain.filter(
              (id) => id !== fileId
            );
          }
        })
        .catch((error) => {
          console.error("Error deleting the file:", error);
        });
    },
  },
};
</script>

<style scoped>
.vertical-layout {
  display: inline-flex;
  align-items: flex-start;
  flex-wrap: wrap;
  font-size: 0;
  flex-direction: column;

  margin-left: 2%;
}
</style>
