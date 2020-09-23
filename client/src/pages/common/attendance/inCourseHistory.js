import { ArrowRightOutlined, DeleteFilled, RedoOutlined } from '@ant-design/icons';
import { useMutation, useQuery } from '@apollo/react-hooks';
import {
  Button,
  Card,
  Divider,
  Layout,
  message,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import moment from 'moment';
import React, { useContext, useEffect, useState } from 'react';
import Modal from '../../../components/common/customModal';
import {
  Footer,
  Greeting,
  Navbar,
  PageTitleBreadcrumb,
} from '../../../components/common/sharedLayout';
import { AttendanceContext, AuthContext } from '../../../context';
import { CheckError, ErrorComp } from '../../../ErrorHandling';
import { modalItems } from '../../../globalData';
import { DELETE_ATTENDANCE_MUTATION } from '../../../graphql/mutation';
import { FETCH_ATTENDANCES_IN_COURSE_QUERY } from '../../../graphql/query';

const { Title } = Typography;
const { Content } = Layout;

const ds = [
  {
    key: '1',
    bil: '1',
    date: '2020/8/19',
    time: '10:19',
    course: 'sss',
    stats: '5/20',
  },
];

export default (props) => {
  const { user } = useContext(AuthContext);
  const [attendances, setAttendances] = useState([]);

  const columns = [
    {
      title: <strong>Bil</strong>,
      dataIndex: 'bil',
      key: 'bil',
    },
    {
      key: 'date',
      title: <strong>Date</strong>,
      dataIndex: 'date',
      align: 'center',
    },
    {
      key: 'time',
      title: <strong>Time</strong>,
      dataIndex: 'time',
      align: 'center',
    },
    {
      key: 'stats',
      title: <strong>Stats</strong>,
      dataIndex: 'stats',
      align: 'center',
    },
    {
      title: <strong>{user.userLevel === 1 ? 'Action' : 'Status'}</strong>,
      dataIndex: user.userLevel === 1 ? 'action' : 'status',
      render: (_, record) =>
        user.userLevel === 1 ? (
          <div>
            <Button
              onClick={() => handleAccess(record)}
              style={{ margin: '10px' }}
              icon={<ArrowRightOutlined />}
            ></Button>

            <Button
              onClick={() => handleDelete(record)}
              loading={
                selectedAttendance.key == record.key &&
                deleteAttendanceStatus.loading
              }
              disabled={
                selectedAttendance.key == record.key &&
                deleteAttendanceStatus.loading
              }
              style={{ margin: '10px' }}
              type='danger'
              icon={<DeleteFilled />}
            ></Button>
          </div>
        ) : (
          <Tag color={record.status === 'Absent' ? 'volcano' : 'green'}>
            {record.status}
          </Tag>
        ),
      align: 'center',
    },
  ];

  //modal visible boolean
  const [visible, SetVisible] = useState(false);

  //get total attendances count query
  const [selectedAttendance, setSelectedAttendance] = useState({});

  const { data, loading, error, refetch } = useQuery(
    FETCH_ATTENDANCES_IN_COURSE_QUERY,
    {
      onError(err) {
        CheckError(err);
      },
      variables: {
        courseID: props.match.params.id,
      },
      notifyOnNetworkStatusChange: true,
    }
  );

  const [deleteAttendanceCallback, deleteAttendanceStatus] = useMutation(
    DELETE_ATTENDANCE_MUTATION,
    {
      onCompleted(data) {
        SetVisible(false);
        message.success('Delete Success');
        refetch();
      },
      onError(err) {
        CheckError(err);
      },
      variables: {
        attendanceID: selectedAttendance.key,
      },
    }
  );

  useEffect(() => {
    setAttendances(data?.getAttendancesInCourse.attendances || []);
  }, [data]);

  const handleAccess = (attendance) => {
    props.history.push(
      `/course/${props.match.params.id}/history/${attendance.key}`
    );
  };

  const handleDelete = (attendance) => {
    setSelectedAttendance(attendance);
    SetVisible(true);
  };
  const handleOk = (e) => {
    deleteAttendanceCallback();
  };

  const handleCancel = (e) => {
    SetVisible(false);
  };

  const parseAttendanceData = (attendances) => {
    let parsedData = [];
    attendances.map((att, index) => {
      const tmp = {
        key: att._id,
        bil: index + 1,
        date: moment(att.date).format('DD/MM/YYYY'),
        time: moment(att.time).format('HH:mm'),
        stats:
          att.attendees.length +
          '/' +
          (+att.absentees.length + +att.attendees.length),
      };
      if (user.userLevel === 0) {
        const isAttend = att.attendees.find((stud) => stud.info._id === user._id);
        Object.assign(tmp, { status: isAttend ? 'Attend' : 'Absent' });
      }
      parsedData.push(tmp);
    });

    return parsedData;
  };

  return (
    <Layout className='layout'>
      <Navbar />
      <Layout>
        <Greeting />
        <PageTitleBreadcrumb
          titleList={[
            { name: 'Home', link: '/dashboard' },
            {
              name: `Course: ${props.match.params.id}`,
              link: `/course/${props.match.params.id}`,
            },
            {
              name: 'Attendance History',
              link: `/course/${props.match.params.id}/history`,
            },
          ]}
        />
        <Content>
          <Card>
            {error && <ErrorComp err={error} />}
            {!error && (
              <Space direction='vertical' className='width100'>
                {data && (
                  <Title level={4}>
                    Course:{' '}
                    {`${data.getAttendancesInCourse.course.code} ${data.getAttendancesInCourse.course.name} (${data.getAttendancesInCourse.course.session})`}
                  </Title>
                )}
                <Divider />
                <h1>Total Attendance: {attendances?.length || 0}</h1>
                <Button
                  style={{ float: 'right' }}
                  icon={<RedoOutlined />}
                  disabled={loading}
                  loading={loading}
                  onClick={() => refetch()}
                >
                  Refresh Table
                </Button>
                <Table
                  loading={loading}
                  pagination={{ pageSize: 20 }}
                  dataSource={parseAttendanceData(attendances)}
                  columns={columns}
                />

                {/*modal backdrop*/}
                <Modal
                  title='Delete Attendance'
                  action={modalItems.attendance.action.delete}
                  itemType={modalItems.attendance.name}
                  visible={visible}
                  loading={deleteAttendanceStatus.loading}
                  handleOk={handleOk}
                  handleCancel={handleCancel}
                  payload={selectedAttendance}
                />
              </Space>
            )}
          </Card>
        </Content>

        <Footer />
      </Layout>
    </Layout>
  );
};
