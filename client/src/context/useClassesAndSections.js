import { useState, useEffect } from "react";
import api from "../api/axios";

// Fallback in case DB has zero records
const DEFAULT_CLASSES = [
  { class: "1", sections: ["A", "B"] },
  { class: "2", sections: ["A", "B"] },
  { class: "3", sections: ["A", "B", "C"] },
  { class: "4", sections: ["A", "B"] },
  { class: "5", sections: ["A", "B"] },
  { class: "6", sections: ["A", "B"] },
  { class: "7", sections: ["A", "B"] },
  { class: "8", sections: ["A", "B"] },
  { class: "9", sections: ["A", "B"] },
  { class: "10", sections: ["A", "B", "C"] },
];

export const useClassesAndSections = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchClasses = async () => {
      try {
        const res = await api.get("/students/classes-sections");
        if (isMounted) {
          if (Array.isArray(res.data) && res.data.length > 0) {
            setData(res.data);
          } else {
            setData(DEFAULT_CLASSES);
          }
        }
      } catch (err) {
        if (isMounted) {
          setData(DEFAULT_CLASSES);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchClasses();
    return () => {
      isMounted = false;
    };
  }, []);

  const classList = data.map((item) => item.class);

  const getSectionsForClass = (selectedClass) => {
    if (!selectedClass) return [];
    const item = data.find(
      (c) => String(c.class).toLowerCase() === String(selectedClass).toLowerCase()
    );
    if (item && item.sections && item.sections.length > 0) {
      return item.sections;
    }
    return ["A", "B", "C"];
  };

  return {
    classes: classList,
    classSectionData: data,
    getSectionsForClass,
    loading,
  };
};

export default useClassesAndSections;
