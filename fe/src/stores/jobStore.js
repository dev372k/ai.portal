import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useJobStore = defineStore('jobs', () => {
  const jobs = ref([
    { id: 1, title: "Frontend Engineer", company: "Acme Co", location: "Remote", open: true },
    { id: 2, title: "Backend Engineer", company: "Beechmind", location: "Milan, IT", open: true },
    { id: 3, title: "Data Scientist", company: "QuickValide", location: "Remote", open: false }
  ])

  return { jobs }
})
