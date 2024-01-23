<template>
  <div class="form-container">
    <el-form
      :model="formData"
      ref="form"
      label-width="120px"
      label-position="top"
    >
      <h3>Form</h3>

      <el-divider border-style="dashed" />
      <div class="form-header">
        <el-button type="primary" @click="clearForm" class="shadow">Clear Form</el-button>
        
        <div class="saving-status">
          <el-icon v-if="!formModified" color="#337ecc" :size="20">
            <checked />
          </el-icon>
          <el-icon v-else-if="savingStatus === 'saving'" class="is-loading">
            <loading />
          </el-icon>
          <el-icon
            v-else-if="savingStatus === 'success'"
            color="#67C23A"
            :size="20"
          >
            <check />
          </el-icon>
          <span v-if="formModified" style="color: #909399">{{
            savingStatusText
          }}</span>
          <span v-else style="color: #529b2e">This form support auto-save</span>
        </div>
      </div>
      <br>
      <el-form-item
        v-for="x of form"
        :key="x.question"
        :label="x.required ? `${x.question}` : x.question"
        :required="x.required"
        :rules="[
          {
            required: x.required,
            message: 'This field is required',
            trigger: 'blur',
          },
        ]"
      >
        <el-input
          v-if="x.type === 'text'"
          v-model="x.value"
          required
        ></el-input>
        <el-input
          v-else-if="x.type === 'number'"
          v-model="x.value"
          pattern="^\d+(\s\d+\/\d+)?(\.\d+)?$|^\d+\/\d+$"
          title="Valid forms: _ , _._ , n/d , _ n/d"
          required
          style="width:150px"
        ></el-input>
        <el-input
          v-else-if="x.type === 'integer'"
          v-model="x.value"
          required
          pattern="^\d+$"
          style="width:100px"
        ></el-input>
        <el-radio-group
          v-else-if="x.type === 'radio'"
          v-model="x.value"
          required
          class="vertical-layout"
          @change="handleRadioChange(x, $event)"
        >
          <el-radio v-for="option in x.options" :key="option" :label="option">{{
            option
          }}</el-radio>

          <el-radio label="other" :value="x.otherValue"></el-radio>

          <el-input
            v-if="x.showOtherInput"
            v-model="x.otherValue"
            :rows="3"
            type="textarea"
            placeholder="Please input"
          ></el-input>
        </el-radio-group>

        <el-checkbox-group
          v-else-if="x.type === 'checkbox'"
          v-model="x.value"
          @change="handleCheckboxChange(x, $event)"
          class="vertical-layout"
        >
          <el-checkbox
            v-for="option in x.options"
            :key="option"
            :label="option"
            >{{ option }}</el-checkbox
          >
          <el-checkbox label="other"></el-checkbox>
          <el-input
            v-if="x.showOtherInput"
            v-model="x.otherValue"
            :rows="3"
            placeholder="Please input"
          ></el-input>
        </el-checkbox-group>

        <!-- wrong:<el-input v-else-if="x.type==='select'" v-model="x.value" required></el-input>-->
        <el-input
          v-else-if="x.type === 'textarea'"
          type="textarea"
          v-model="x.value"
          required
        ></el-input>
      </el-form-item>
      <!-- ...... -->

      <el-form-item label="Picture - Full Robot">
        <el-upload
          class="upload-demo"
          drag
          action="http://localhost:3000/upload?type=full_robot"
          :on-success="handleSuccess"
          :on-remove="handleRemove"
          :file-list="fileList.fullRobot"
          list-type="picture"
        >
          <el-icon :size="50" color="#b3b3b3">
            <upload />
          </el-icon>
          <div class="el-upload__text">
            Drag files here or <em>click to upload</em>
          </div>
        </el-upload>
      </el-form-item>

      <el-form-item label="Picture - Drive Train">
        <el-upload
          class="upload-demo"
          drag
          action="http://localhost:3000/upload?type=drive_train"
          :on-success="handleSuccess"
          :on-remove="handleRemove"
          :file-list="fileList.driveTrain"
          list-type="picture"
        >
          <el-icon :size="50" color="#b3b3b3">
            <upload />
          </el-icon>
          <div class="el-upload__text">
            Drag files here or <em>click to upload</em>
          </div>
        </el-upload>
      </el-form-item>
      <el-button type="primary" @click="submitForm" class="shadow">Submit</el-button>
    </el-form>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      savingStatus: "idle", // Possible values: 'idle', 'saving', 'success', 'error'
      formModified: false,

      form: [
        {
          question: "Event",
          type: "text",
          required: true,
          value: null,
        },
        {
          question: "Team number",
          type: "integer",
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
      saveTimeout: "",

      // el-form
      formData: {
        event: "",
        teamNumber: null,
        typeOfDriveTrain: "",
        typeOfWheelsUsed: "",
        intakeUse: "",
        scoringLocations: "",
        robotWeight: "",
        robotDimensionLength: "",
        robotDimensionWidth: "",
        robotDimensionHeight: "",
        driveTeamMembers: "",
        hoursWeeksOfPractice: "",
        additionalComments: "",
      },
    };
  },

  created() {
    this.restoreFormData();
  },

  computed: {
    fileList() {
      return this.form.filter((item) => item.type === "file");
    },

    savingStatusText() {
      switch (this.savingStatus) {
        case "idle":
          return "";
        case "saving":
          return "Saving...";
        case "success":
          return "All changes saved";
        case "error":
          return "Error saving changes";
        default:
          return "";
      }
    },
  },

  watch: {
    form: {
      handler(newForm) {
        // If the form is modified, set the saving status to 'saving'
        if (!this.formModified) {
          this.formModified = true;
        }
        if (this.saveTimeout) {
          clearTimeout(this.saveTimeout);
        }

        this.savingStatus = "saving";

        this.saveTimeout = setTimeout(() => {
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

          this.savingStatus = "success";
        }, 2000); // 2秒后才将状态设置为'success'
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

    beforeDestroy() {
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
      }
    },

    clearForm() {
      this.$confirm("Are you sure you want to clear the form?", "Warning", {
        confirmButtonText: "Yes",
        cancelButtonText: "No",
        type: "warning",
      })
        .then(() => {
          this.resetFormData();
          this.$message({
            type: "success",
            message: "Form has been cleared!",
          });

          // Reset the saving status
          this.formModified = false;
        })
        .catch(() => {
          this.$message({
            type: "info",
            message: "Clear canceled",
          });
        });
    },

    resetFormData() {
      this.form.forEach((question) => {
        if (question.type === "checkbox") {
          question.value = [];
        } else {
          question.value = null;
        }
        question.showOtherInput = false;
        question.otherValue = "";
      });
    },

    submitForm() {
      console.log("Submitting form with fileIds:", this.fileIds);
      this.$refs.form.validate(async (valid) => {
        if (valid) {
          // 在提交前打印fileIds的实际值
          console.log("Submitting fileIds:", JSON.stringify(this.fileIds));
          console.log("Full Robot Image IDs:", this.fileIds.fullRobot);
          console.log("Drive Train Image IDs:", this.fileIds.driveTrain);
          console.log("Other Value:", this.form[4].otherValue);
          try {
            let formData = new FormData();
            this.form.forEach((item) => {
              // 检查是否是radio或checkbox类型且用户选择了'其他'
              if (
                (item.type === "radio" || item.type === "checkbox") &&
                item.showOtherInput
              ) {
                formData.append(item.question, item.otherValue);
              } else {
                formData.append(item.question, item.value);
              }
            });

            // Add file IDs to the form data
            formData.append(
              "fullRobotImageId",
              this.fileIds.fullRobot.join(",")
            );
            formData.append(
              "driveTrainImageId",
              this.fileIds.driveTrain.join(",")
            );

            await axios.post("http://localhost:3000/submit-form", formData, {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            });

            this.$message.success("Form submitted successfully");
          } catch (error) {
            console.error("Error submitting form:", error);
            this.$message.error("Error submitting form");
          }
        }
      });
    },

    handleSuccess(response, file) {
      console.log("Upload successful:", response);
      if (response && response.fileId) {
        const fileId = response.fileId;

        // 判断上传类型并更新 fileIds
        if (this.fileList.fullRobot.includes(file)) {
          this.fileIds.fullRobot.push(fileId);
        } else if (this.fileList.driveTrain.includes(file)) {
          this.fileIds.driveTrain.push(fileId);
        }

        // 打印更新后的 fileIds
        console.log("Updated fileIds:", JSON.stringify(this.fileIds));
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
.form-container {
  padding: 10px 20px;
  border-radius: 15px;
  box-shadow: 0 2px 1px -1px rgba(0, 0, 0, 0.2),
    -3px -1px 3px 0 rgba(0, 0, 0, 0.14), 0px 3px 3px 0 rgba(0, 0, 0, 0.12),
    4px 0px 3px 0 rgba(0, 0, 0, 0.12);
  background-color: #c6e2ff;
}

.form-header {
  display: flex;
  align-items: flex-end;
  align-content: center;
  justify-content: space-between;
  flex-wrap: wrap;
}

.saving-status {
  display: flex;
  align-items: center;
}

.vertical-layout {
  display: inline-flex;
  align-items: flex-start;
  flex-wrap: wrap;
  font-size: 0;
  flex-direction: column;

  margin-left: 2%;
}
.shadow {
    box-shadow: 0 6px #3077b9;
    transition: all .1s ease-in-out;
}
.shadow:hover { 
  box-shadow: 0 6px #76a5e3;
  transition: all .1s ease-in-out;}
</style>
