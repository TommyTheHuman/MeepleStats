import { useEffect, useState } from "react";
import { StatisticCardInterface } from "../model/Interfaces";
import { fetchStatistics } from "../api/statisticApi";
import { Card, Loader, Text, TextInput } from "@mantine/core";
import { DateInput, DateValue } from "@mantine/dates";


const StatisticCard = ({ endpoint, title, filters }: StatisticCardInterface) => {

  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
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
      // FIXME: add more types of filters --> year, month ecc.
      if (filter.type === 'string') {
        // return a text input for the player name
        return (
          <TextInput
            label={filter.label}
            key={filter.value}
            onChange={(event) => handleFilterChange(filter.value, event.currentTarget.value)}
            value={filterValues[filter.value] || ''} // Set the value of the input to the value in the state
          />
        );
      } else if (filter.type === 'date') {
        // return a date picker
        return (
          <DateInput
            label={filter.label}
            key={filter.value}
            size="sm"
            value={filterValues[filter.value] ? new Date(filterValues[filter.value]) : null}
            onChange={(date) => handleFilterChange(filter.value, formatDate(date))}
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