import { useEffect, useState } from "react";
import { StatisticCardInterface } from "../model/Interfaces";
import { fetchStatistics } from "../api/statisticApi";
import { Card, Loader, Text, TextInput } from "@mantine/core";
import { DateInput, DateValue, MonthPickerInput, YearPickerInput } from "@mantine/dates";
import { FilterTypes } from "../model/Constants";


const StatisticCard = ({ endpoint, title, filters }: StatisticCardInterface) => {

  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Filter out any empty values from the filterValues object
        Object.keys(filterValues).forEach((key) => (filterValues[key] === "" && delete filterValues[key]));
        const result = await fetchStatistics(endpoint, filterValues);
        setData(result);
        setError(null);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError(String(error));
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [endpoint, filterValues]);

  const renderData = () => {
    if (typeof data === "number") {
      return <Text>{data}</Text>;
    } else if (Array.isArray(data)) {
      return (
        <div>
          {data.map((item, index) => (
            <div key={index}>
              {Object.entries(item).map(([key, value]) => (
                key !== "_id" && (
                  <Text key={key}>
                    <strong>{key}:</strong> {JSON.stringify(value)}
                  </Text>
                )
              ))}
            </div>
          ))}
        </div>
      );
    } else if (typeof data === "object" && data !== null) {
      return (
        <div>
          {Object.entries(data).map(([key, value]) => (
            key !== "_id" && (
              <Text key={key}>
                <strong>{key}:</strong> {JSON.stringify(value)}
              </Text>
            )
          ))}
        </div>
      );
    } else {
      return <Text>No data available</Text>;
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues({ ...filterValues, [key]: value });
  };

  const formatDate = (date: DateValue) => {
    if (date === null) {
      return '';
    } else {
      return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
    }
  }

  const renderFilters = () => {
    return filters?.map((filter) => {
      if (filter.type === FilterTypes.string) {
        // return a text input for the player name
        return (
          <TextInput
            label={filter.label}
            key={filter.value}
            onChange={(event) => handleFilterChange(filter.value, event.currentTarget.value)}
            value={filterValues[filter.value] || ''} // Set the value of the input to the value in the state
          />
        );
      } else if (filter.type === FilterTypes.date) {
        // return a date picker
        return (
          <DateInput
            label={filter.label}
            key={filter.value}
            value={filterValues[filter.value] ? new Date(filterValues[filter.value]) : null}
            onChange={(date) => handleFilterChange(filter.value, formatDate(date))}
          />
        );
      } else if (filter.type === FilterTypes.month) {
        return (
          <MonthPickerInput
            label={filter.label}
            key={filter.value}
            valueFormat="MMMM"
            clearable
            value={filterValues[filter.value] ? new Date(new Date().getFullYear(), parseInt(filterValues[filter.value]), 1) : null}
            minDate={new Date(new Date().getFullYear(), 0, 1)} // Restrict to current year
            maxDate={new Date(new Date().getFullYear(), 11, 31)} // Restrict to current year
            onChange={(date) => handleFilterChange(filter.value, date?.getMonth().toString() || '')}
          />
        );
      } else if (filter.type === FilterTypes.year) {
        return (
          <YearPickerInput
            label={filter.label}
            key={filter.value}
            clearable
            value={filterValues[filter.value] ? new Date(filterValues[filter.value]) : null}
            onChange={(date) => handleFilterChange(filter.value, date?.getFullYear().toString() || '')}
          />
        );
      }
    })
  };

  return (
    <Card shadow="sm" padding="xl">
      <Text>{title}</Text>
      {renderFilters()}
      {loading ? (
        <Loader />
      ) : error ? (
        <Text c="red">{error}</Text>
      ) : (
        renderData()
      )}
    </Card>
  );
};

export default StatisticCard;