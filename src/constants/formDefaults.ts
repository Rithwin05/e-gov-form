import { AadhaarFormData } from "@/types/form";

export const defaultFormValues: Partial<AadhaarFormData> = {
  aadhaarNumber: "",
  fullName: "",
  houseNo: "",
  street: "",
  landmark: "",
  area: "",
  city: "",
  postOffice: "",
  district: "",
  state: "",
  pinCode: "",
  residentCategory: "Resident",
  requestType: "NewEnrolment",
  certifierName: "",
  certifierDesignation: "",
  certifierOfficeAddress: "",
  certifierContact: "",
  certifierType: "GazettedA",
};
