import React from 'react';
import {
    AppBar as AppBarMui,
    Box,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Stack,
    Toolbar,
    Typography,
} from '@mui/material';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import { useRouter } from 'next/router';
import { MonthSelectedContext } from '../contexts/monthSelected';
import { useAuth } from '../hooks/useAuth';

type NavigationItem = {
    label: string;
    path: '/' | '/expenses' | '/revenues';
    icon: React.ReactNode;
};

const navigationItems: NavigationItem[] = [
    { label: 'Home', path: '/', icon: <HomeRoundedIcon fontSize='small' /> },
    { label: 'Despesas', path: '/expenses', icon: <TrendingDownRoundedIcon fontSize='small' /> },
    { label: 'Receitas', path: '/revenues', icon: <TrendingUpRoundedIcon fontSize='small' /> },
];

export const AppBar: React.FC = () => {
    const router = useRouter();
    const { dateToAnalyze, handleNextMonth, handlePreviousMonth } = React.useContext(MonthSelectedContext);
    const { signOut } = useAuth();

    const [openDrawer, setOpenDrawer] = React.useState(false);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleOpenDrawer = () => {
        setOpenDrawer(true);
    };

    const handleCloseDrawer = () => {
        setOpenDrawer(false);
    };

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const navigateWithCurrentQuery = (path: NavigationItem['path']) => {
        router.push({
            pathname: path,
            query: router.query,
        });
        handleCloseDrawer();
    };

    return (
        <AppBarMui
            component='nav'
            elevation={0}
            sx={{
                background: 'linear-gradient(136deg, #082b43 0%, #0f6a72 48%, #15917c 100%)',
                borderBottom: '1px solid rgba(213, 248, 255, 0.22)',
                overflow: 'hidden',
                '&::before, &::after': {
                    content: '""',
                    position: 'absolute',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                },
                '&::before': {
                    width: 180,
                    height: 180,
                    top: -120,
                    right: -48,
                    background: 'radial-gradient(circle, rgba(213, 248, 255, 0.28) 0%, rgba(213, 248, 255, 0) 72%)',
                },
                '&::after': {
                    width: 150,
                    height: 150,
                    bottom: -110,
                    left: -52,
                    background: 'radial-gradient(circle, rgba(199, 240, 216, 0.26) 0%, rgba(199, 240, 216, 0) 72%)',
                },
            }}
        >
            <Toolbar sx={{ minHeight: { xs: 62, sm: 66 }, px: { xs: 1, sm: 1.6 }, position: 'relative' }}>
                <Box
                    sx={{
                        width: 1,
                        display: 'grid',
                        gridTemplateColumns: '1fr auto 1fr',
                        alignItems: 'center',
                        gap: 1,
                    }}
                >
                    <Stack
                        direction='row'
                        spacing={0.5}
                        alignItems='center'
                        sx={{ justifySelf: 'start', color: '#d5f8ff', pl: { xs: 0.2, sm: 0.5 } }}
                    >
                        <IconButton
                            size='small'
                            onClick={handleOpenDrawer}
                            aria-label='abrir menu lateral'
                            sx={{
                                color: '#e8fcff',
                                backgroundColor: 'rgba(232, 252, 255, 0.12)',
                                border: '1px solid rgba(232, 252, 255, 0.24)',
                                width: 30,
                                height: 30,
                                '&:hover': { backgroundColor: 'rgba(232, 252, 255, 0.22)' },
                            }}
                        >
                            <MenuRoundedIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                    </Stack>

                    <Stack
                        direction='row'
                        spacing={0.5}
                        alignItems='center'
                        sx={{
                            px: 0.6,
                            py: 0.25,
                            borderRadius: 20,
                            backgroundColor: 'rgba(213, 248, 255, 0.14)',
                            border: '1px solid rgba(213, 248, 255, 0.3)',
                            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 14px 24px -20px rgba(0, 0, 0, 0.5)',
                        }}
                    >
                        <IconButton
                            onClick={handlePreviousMonth}
                            size='small'
                            aria-label='mes anterior'
                            sx={{
                                color: '#d9f8ff',
                                backgroundColor: 'rgba(217, 248, 255, 0.16)',
                                '&:hover': { backgroundColor: 'rgba(217, 248, 255, 0.26)' },
                            }}
                        >
                            <ArrowBackIosNewRoundedIcon sx={{ fontSize: 15 }} />
                        </IconButton>

                        <Typography
                            sx={{
                                minWidth: { xs: 92, sm: 108 },
                                textAlign: 'center',
                                fontSize: { xs: 12, sm: 13 },
                                fontWeight: 700,
                                letterSpacing: '.05em',
                                color: '#ecfcff',
                                textTransform: 'uppercase',
                            }}
                        >
                            {dateToAnalyze.format('MMM/YYYY')}
                        </Typography>

                        <IconButton
                            onClick={handleNextMonth}
                            size='small'
                            aria-label='mes seguinte'
                            sx={{
                                color: '#d9f8ff',
                                backgroundColor: 'rgba(217, 248, 255, 0.16)',
                                '&:hover': { backgroundColor: 'rgba(217, 248, 255, 0.26)' },
                            }}
                        >
                            <ArrowForwardIosRoundedIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                    </Stack>

                    <Box sx={{ justifySelf: 'end' }}>
                        <IconButton
                            size='large'
                            color='inherit'
                            aria-label='abrir menu de conta'
                            onClick={handleClick}
                            sx={{
                                color: '#e8fcff',
                                backgroundColor: 'rgba(232, 252, 255, 0.12)',
                                border: '1px solid rgba(232, 252, 255, 0.24)',
                                width: 36,
                                height: 36,
                                '&:hover': { backgroundColor: 'rgba(232, 252, 255, 0.22)' },
                            }}
                        >
                            <AccountCircleRoundedIcon sx={{ fontSize: 21 }} />
                        </IconButton>
                    </Box>
                </Box>

                <Menu
                    id='basic-menu'
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleClose}
                    MenuListProps={{
                        'aria-labelledby': 'basic-button',
                    }}
                    PaperProps={{
                        sx: {
                            mt: 1,
                            borderRadius: 2.5,
                            border: '1px solid rgba(8, 43, 67, 0.12)',
                            boxShadow: '0 16px 30px -24px rgba(8, 43, 67, 0.55)',
                        },
                    }}
                >
                    <MenuItem onClick={signOut}>
                        <LogoutIcon sx={{ mr: 1.2 }} fontSize='small' />
                        Sair da conta
                    </MenuItem>
                </Menu>

                <Drawer
                    anchor='left'
                    open={openDrawer}
                    onClose={handleCloseDrawer}
                    PaperProps={{
                        sx: {
                            width: 280,
                            borderTopRightRadius: 14,
                            borderBottomRightRadius: 14,
                            borderRight: '1px solid rgba(8, 43, 67, 0.12)',
                            boxShadow: '0 20px 35px -28px rgba(8, 43, 67, 0.7)',
                            overflow: 'hidden',
                        },
                    }}
                >
                    <Box
                        sx={{
                            px: 2,
                            py: 2.3,
                            background: 'linear-gradient(136deg, #082b43 0%, #0f6a72 48%, #15917c 100%)',
                            color: '#ecfcff',
                        }}
                    >
                        <Typography sx={{ fontSize: 21, fontWeight: 700, lineHeight: 1.2 }}>Finan Family</Typography>
                    </Box>

                    <List sx={{ py: 0.8 }}>
                        {navigationItems.map(item => (
                            <ListItemButton
                                key={item.path}
                                onClick={() => navigateWithCurrentQuery(item.path)}
                                selected={router.pathname === item.path}
                                sx={{
                                    mx: 1,
                                    borderRadius: 2,
                                    '&.Mui-selected': {
                                        backgroundColor: 'rgba(15, 106, 114, 0.12)',
                                    },
                                    '&.Mui-selected:hover': {
                                        backgroundColor: 'rgba(15, 106, 114, 0.18)',
                                    },
                                }}
                            >
                                <ListItemIcon sx={{ color: '#0f6a72', minWidth: 34 }}>{item.icon}</ListItemIcon>
                                <ListItemText
                                    primary={item.label}
                                    primaryTypographyProps={{ fontWeight: 600, color: '#123047' }}
                                />
                            </ListItemButton>
                        ))}
                    </List>

                    <Divider />
                    <List sx={{ py: 0.8 }}>
                        <ListItemButton
                            onClick={() => {
                                signOut();
                                handleCloseDrawer();
                            }}
                            sx={{ mx: 1, borderRadius: 2 }}
                        >
                            <ListItemIcon sx={{ color: '#0f6a72', minWidth: 34 }}>
                                <LogoutIcon fontSize='small' />
                            </ListItemIcon>
                            <ListItemText
                                primary='Sair da conta'
                                primaryTypographyProps={{ fontWeight: 600, color: '#123047' }}
                            />
                        </ListItemButton>
                    </List>
                </Drawer>
            </Toolbar>
        </AppBarMui>
    );
};
